"""The two-person confirmation rule."""
from __future__ import annotations

import io

from sqlalchemy import text


def test_upload_starts_pending_with_one_signature(statement):
    assert statement["status"] == "PENDING_CONFIRMATION"
    assert statement["two_person_complete"] is False
    assert len(statement["signatures"]) == 1
    assert statement["signatures"][0]["role"] == "COLLECTING_OFFICER"
    assert statement["signatures"][0]["valid"] is True


def test_collecting_officer_cannot_confirm_their_own_item(client, officers, statement):
    response = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_collector"],
        json={},
    )
    assert response.status_code == 409
    assert "different officer" in response.json()["detail"]


def test_second_officer_completes_the_confirmation(client, officers, statement):
    confirmed = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={"note": "item witnessed at collection"},
    ).json()
    assert confirmed["status"] == "CONFIRMED"
    assert confirmed["two_person_complete"] is True
    assert confirmed["witnessing_officer_id"] == officers["witness"]["id"]
    roles = {s["role"] for s in confirmed["signatures"]}
    assert roles == {"COLLECTING_OFFICER", "WITNESSING_OFFICER"}
    assert all(s["valid"] for s in confirmed["signatures"])


def test_both_signatures_are_written_into_the_chain(client, officers, case, statement):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    confirm_entry = next(e for e in entries if e["event_type"] == "EVIDENCE_CONFIRMED")
    signatures = confirm_entry["payload"]["signatures"]
    assert signatures["COLLECTING_OFFICER"]
    assert signatures["WITNESSING_OFFICER"]
    assert signatures["COLLECTING_OFFICER"] != signatures["WITNESSING_OFFICER"]


def test_confirming_twice_is_refused(client, officers, statement):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    again = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    assert again.status_code == 409


def test_forged_signature_fails_verification(client, officers, statement, db):
    """Flipping the stored signature must not silently pass as valid."""
    db.execute(
        text(
            "UPDATE evidence_signatures SET signature=:s WHERE evidence_id="
            "(SELECT id FROM evidence WHERE uid=:u)"
        ),
        {"s": "00" * 64, "u": statement["uid"]},
    )
    db.commit()
    detail = client.get(
        f"/api/v1/evidence/{statement['uid']}", headers=officers["h_collector"]
    ).json()
    assert detail["signatures"][0]["valid"] is False
    assert detail["two_person_complete"] is False


def test_two_person_is_mandatory_for_physical_evidence(client, officers, case):
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("knife.txt", io.BytesIO(b"seized knife record"), "text/plain")},
        data={
            "evidence_type": "WEAPON",
            "title": "Seized knife",
            "requires_two_person": "false",
        },
    )
    assert response.status_code == 422
    assert "mandatory" in response.json()["detail"]


def test_rejection_is_recorded_not_deleted(client, officers, case, statement):
    rejected = client.post(
        f"/api/v1/evidence/{statement['uid']}/reject",
        headers=officers["h_witness"],
        json={"reason": "item was not present at collection as described"},
    ).json()
    assert rejected["status"] == "REJECTED"
    assert rejected["rejection_reason"].startswith("item was not present")

    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    assert any(e["event_type"] == "EVIDENCE_REJECTED" for e in entries)
    # still retrievable -- nothing is erased from the record
    assert (
        client.get(
            f"/api/v1/evidence/{statement['uid']}", headers=officers["h_collector"]
        ).status_code
        == 200
    )


def test_rejected_evidence_cannot_then_be_confirmed(client, officers, statement):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/reject",
        headers=officers["h_witness"],
        json={"reason": "chain of custody unclear"},
    )
    response = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    assert response.status_code == 409


def test_pending_queue_lists_unconfirmed_items(client, officers, case, statement):
    pending = client.get(
        f"/api/v1/cases/{case['id']}/evidence/pending", headers=officers["h_witness"]
    ).json()
    assert [p["uid"] for p in pending] == [statement["uid"]]

    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    assert (
        client.get(
            f"/api/v1/cases/{case['id']}/evidence/pending", headers=officers["h_witness"]
        ).json()
        == []
    )


def test_confirmed_filter_is_the_verified_case_record(client, officers, case, statement):
    """Parts 2-4 read status=CONFIRMED; a pending item must not appear there."""
    assert (
        client.get(
            f"/api/v1/cases/{case['id']}/evidence?status=CONFIRMED",
            headers=officers["h_collector"],
        ).json()
        == []
    )
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    confirmed = client.get(
        f"/api/v1/cases/{case['id']}/evidence?status=CONFIRMED",
        headers=officers["h_collector"],
    ).json()
    assert [c["uid"] for c in confirmed] == [statement["uid"]]

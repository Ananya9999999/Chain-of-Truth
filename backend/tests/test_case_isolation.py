"""Cases must not leak into each other.

Each case owns its own independent chain. Real stations run many cases at once,
and a break in one must not cast doubt on the others.
"""
from __future__ import annotations

import io

from sqlalchemy import text

import pytest


@pytest.fixture()
def two_cases(client, officers):
    a = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "CR-A-001", "title": "Case A"},
    ).json()
    b = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "CR-B-002", "title": "Case B"},
    ).json()
    return a, b


def _log(client, officers, case, title, body):
    return client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={"evidence_type": "WITNESS_STATEMENT", "title": title, "text_content": body},
    ).json()


def test_each_case_gets_its_own_chain_from_genesis(client, officers, two_cases):
    a, b = two_cases
    for case in (a, b):
        entries = client.get(
            f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
        ).json()
        assert entries[0]["seq"] == 0
        assert entries[0]["prev_hash"] == "0" * 64
        assert entries[0]["payload"]["case_number"] == case["case_number"]


def test_evidence_does_not_leak_between_cases(client, officers, two_cases):
    a, b = two_cases
    item_a = _log(client, officers, a, "A statement", "belongs to case A")
    item_b = _log(client, officers, b, "B statement", "belongs to case B")

    listed_a = client.get(
        f"/api/v1/cases/{a['id']}/evidence", headers=officers["h_collector"]
    ).json()
    listed_b = client.get(
        f"/api/v1/cases/{b['id']}/evidence", headers=officers["h_collector"]
    ).json()
    assert [i["uid"] for i in listed_a] == [item_a["uid"]]
    assert [i["uid"] for i in listed_b] == [item_b["uid"]]


def test_ledgers_do_not_leak_between_cases(client, officers, two_cases):
    a, b = two_cases
    _log(client, officers, a, "A statement", "case A body")
    entries_b = client.get(
        f"/api/v1/cases/{b['id']}/ledger", headers=officers["h_collector"]
    ).json()
    assert len(entries_b) == 1  # only its own genesis
    assert all("case A" not in str(e["payload"]) for e in entries_b)


def test_sequence_numbers_are_per_case_not_global(client, officers, two_cases):
    a, b = two_cases
    _log(client, officers, a, "A1", "one")
    _log(client, officers, a, "A2", "two")
    _log(client, officers, b, "B1", "one")

    seqs_a = [
        e["seq"]
        for e in client.get(
            f"/api/v1/cases/{a['id']}/ledger", headers=officers["h_collector"]
        ).json()
    ]
    seqs_b = [
        e["seq"]
        for e in client.get(
            f"/api/v1/cases/{b['id']}/ledger", headers=officers["h_collector"]
        ).json()
    ]
    assert seqs_a == [0, 1, 2]
    assert seqs_b == [0, 1]


def test_breaking_one_case_does_not_invalidate_another(client, officers, two_cases, db):
    """A tampered case is isolated -- the others stay provably intact."""
    a, b = two_cases
    _log(client, officers, a, "A statement", "case A body")
    _log(client, officers, b, "B statement", "case B body")

    db.execute(
        text("UPDATE ledger_entries SET payload='{}' WHERE case_id=:c AND seq=1"),
        {"c": a["id"]},
    )
    db.commit()

    report_a = client.get(
        f"/api/v1/cases/{a['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    report_b = client.get(
        f"/api/v1/cases/{b['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report_a["valid"] is False
    assert report_b["valid"] is True, "a break in case A wrongly implicated case B"


def test_content_verification_only_covers_the_case_being_verified(
    client, officers, two_cases, db
):
    a, b = two_cases
    item_a = _log(client, officers, a, "A statement", "case A body")
    _log(client, officers, b, "B statement", "case B body")

    db.execute(
        text("UPDATE evidence SET text_content='tampered' WHERE uid=:u"),
        {"u": item_a["uid"]},
    )
    db.commit()

    assert (
        client.get(
            f"/api/v1/cases/{b['id']}/ledger/verify", headers=officers["h_collector"]
        ).json()["valid"]
        is True
    )
    assert (
        client.get(
            f"/api/v1/cases/{a['id']}/ledger/verify", headers=officers["h_collector"]
        ).json()["valid"]
        is False
    )


def test_files_are_stored_under_separate_case_folders(client, officers, two_cases, db):
    a, b = two_cases
    uploads = []
    for case in (a, b):
        uploads.append(
            client.post(
                f"/api/v1/cases/{case['id']}/evidence",
                headers=officers["h_collector"],
                files={"file": ("note.txt", io.BytesIO(b"same bytes"), "text/plain")},
                data={"evidence_type": "DOCUMENT", "title": "Note"},
            ).json()
        )
    paths = [
        db.execute(
            text("SELECT storage_path FROM evidence WHERE uid=:u"), {"u": u["uid"]}
        ).scalar_one()
        for u in uploads
    ]
    assert paths[0] != paths[1]
    assert "CR-A-001" in paths[0].replace("\\", "/")
    assert "CR-B-002" in paths[1].replace("\\", "/")


def test_the_audit_log_can_be_filtered_down_to_one_case(client, officers, two_cases):
    a, b = two_cases
    _log(client, officers, a, "A statement", "case A body")
    _log(client, officers, b, "B statement", "case B body")
    client.get(f"/api/v1/cases/{a['id']}", headers=officers["h_witness"])

    entries = client.get(
        "/api/v1/audit", headers=officers["h_collector"], params={"case_id": a["id"], "limit": 200}
    ).json()
    assert entries
    assert {e["case_id"] for e in entries} == {a["id"]}

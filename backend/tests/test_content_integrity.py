"""Regressions for holes found auditing Part 1 against the spec.

Each test here failed before the fix it guards.
"""
from __future__ import annotations

import io

from sqlalchemy import text


def test_editing_a_witness_statement_in_the_database_is_detected(
    client, officers, case, statement, db
):
    """Text evidence carries no file -- it must still be re-hashed on verify.

    The demo's own tampering target is a witness statement. Skipping items with
    no stored file would have let the statement text be rewritten silently.
    """
    db.execute(
        text("UPDATE evidence SET text_content=:t WHERE uid=:u"),
        {"t": "The suspect left the shop at about 11 PM.", "u": statement["uid"]},
    )
    db.commit()

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    assert report["files_valid"] is False
    failure = report["file_integrity"]["failures"][0]
    assert failure["error"] == "TEXT_ALTERED"
    assert failure["evidence_uid"] == statement["uid"]


def test_evidence_detail_reports_altered_statement_text(client, officers, statement, db):
    db.execute(
        text("UPDATE evidence SET text_content='rewritten' WHERE uid=:u"),
        {"u": statement["uid"]},
    )
    db.commit()
    detail = client.get(
        f"/api/v1/evidence/{statement['uid']}", headers=officers["h_collector"]
    ).json()
    assert detail["integrity"]["content_kind"] == "TEXT"
    assert detail["integrity"]["content_intact"] is False
    assert detail["integrity"]["file_intact"] is False


def test_intact_text_evidence_verifies_clean(client, officers, case, statement):
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True
    assert report["file_integrity"]["checked"] == 1  # the statement was checked
    assert report["file_integrity"]["failed"] == 0


def test_a_deleted_evidence_file_is_reported(client, officers, case, db):
    import os

    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("notes.txt", io.BytesIO(b"field notes"), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "Field notes"},
    ).json()
    path = db.execute(
        text("SELECT storage_path FROM evidence WHERE uid=:u"), {"u": upload["uid"]}
    ).scalar_one()
    os.remove(path)

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    assert any(f["error"] == "FILE_MISSING" for f in report["file_integrity"]["failures"])


def test_description_is_committed_to_the_chain(client, officers, case):
    """Anything on the record must be inside the hash, not beside it."""
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Statement",
            "description": "recorded at the station",
            "text_content": "content",
        },
    ).json()
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    entry = next(e for e in entries if e["payload"].get("evidence_uid") == upload["uid"])
    assert entry["payload"]["description"] == "recorded at the station"


def test_a_file_and_inline_text_together_is_refused(client, officers, case):
    """The content hash can only cover one of them; the other would be free."""
    from app.services import evidence as evidence_service
    from app.models import Case, User
    from app.database import SessionLocal

    session = SessionLocal()
    try:
        case_row = session.get(Case, case["id"])
        officer = session.get(User, officers["collector"]["id"])
        try:
            evidence_service.log_evidence(
                session,
                case=case_row,
                collecting_officer=officer,
                evidence_type="AUDIO_RECORDING",
                title="Interview",
                text_content="a transcript that the hash would not cover",
                file_stream=io.BytesIO(b"audio bytes"),
                file_name="interview.wav",
                device_metadata={"device_id": "REC-1"},
            )
            raise AssertionError("expected the combination to be refused")
        except evidence_service.EvidenceError as exc:
            assert exc.code == "AMBIGUOUS_CONTENT"
            assert exc.status_code == 422
    finally:
        session.close()


def test_a_nonsense_timestamp_is_a_422_not_a_crash(client, officers, case):
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Statement",
            "text_content": "content",
            "occurred_at": "yesterday evening",
        },
    )
    assert response.status_code == 422
    assert "ISO-8601" in response.json()["detail"]


def test_a_rejected_upload_leaves_no_orphan_file(client, officers, case):
    """A refused upload must not leave bytes on disk with no record."""
    from app.services import storage

    before = set(storage.case_dir(case["case_number"]).iterdir())
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("knife.txt", io.BytesIO(b"seized knife"), "text/plain")},
        data={
            "evidence_type": "WEAPON",
            "title": "Seized knife",
            "requires_two_person": "false",
        },
    )
    assert response.status_code == 422
    assert set(storage.case_dir(case["case_number"]).iterdir()) == before


def test_a_backwards_shift_is_refused(client, officers):
    response = client.post(
        f"/api/v1/officers/{officers['collector']['id']}/shifts",
        headers=officers["h_collector"],
        json={
            "started_at": "2026-08-30T06:00:00Z",
            "ended_at": "2026-08-29T18:00:00Z",
            "lat": 12.9716,
            "lon": 77.5946,
        },
    )
    assert response.status_code == 422


def test_a_nonsense_shift_timestamp_is_a_422(client, officers):
    response = client.post(
        f"/api/v1/officers/{officers['collector']['id']}/shifts",
        headers=officers["h_collector"],
        json={
            "started_at": "last tuesday",
            "ended_at": "2026-08-30T06:00:00Z",
            "lat": 12.9716,
            "lon": 77.5946,
        },
    )
    assert response.status_code == 422

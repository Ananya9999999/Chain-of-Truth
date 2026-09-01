"""The tamper-proof claim, tested by actually tampering."""
from __future__ import annotations

import io
import json

from sqlalchemy import text

from app.config import GENESIS_HASH


def test_case_creation_writes_genesis_entry(client, officers, case):
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    assert entries[0]["seq"] == 0
    assert entries[0]["event_type"] == "CASE_OPENED"
    assert entries[0]["prev_hash"] == GENESIS_HASH


def test_each_entry_chains_to_the_previous_one(client, officers, case, statement):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    assert [e["seq"] for e in entries] == list(range(len(entries)))
    for previous, current in zip(entries, entries[1:]):
        assert current["prev_hash"] == previous["entry_hash"]


def test_verify_reports_a_clean_chain(client, officers, case, statement):
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True
    assert report["chain_valid"] is True
    assert report["broken_at_seq"] is None
    assert report["errors"] == []


def test_editing_a_past_entry_breaks_the_chain(client, officers, case, statement, db):
    """Rewrite history directly in the database -- verification must catch it."""
    row = db.execute(
        text("SELECT id, payload FROM ledger_entries WHERE case_id=:c AND seq=1"),
        {"c": case["id"]},
    ).one()
    payload = json.loads(row.payload)
    payload["title"] = "Statement of somebody else"
    db.execute(
        text("UPDATE ledger_entries SET payload=:p WHERE id=:i"),
        {"p": json.dumps(payload, sort_keys=True, separators=(",", ":")), "i": row.id},
    )
    db.commit()

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    assert report["broken_at_seq"] == 1
    assert any(e["error"] == "PAYLOAD_ALTERED" for e in report["errors"])


def test_deleting_a_middle_entry_is_detected_as_a_gap(client, officers, case, statement, db):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_witness"],
        json={},
    )
    db.execute(
        text("DELETE FROM ledger_entries WHERE case_id=:c AND seq=1"), {"c": case["id"]}
    )
    db.commit()
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    assert any(e["error"] in {"SEQUENCE_GAP", "BROKEN_LINK"} for e in report["errors"])


def test_chopping_the_tail_off_the_chain_is_detected(client, officers, case, statement, db):
    """A chain cannot see its own tail removed -- the audit log's anchor can.

    Every ledger append also writes the new head into the audit chain, so a
    ledger truncated back to seq 0 is caught by comparing against the highest
    head the audit log ever witnessed.
    """
    before = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert before["valid"] is True
    assert before["witnessed_head"]["seq"] == 1

    db.execute(
        text("DELETE FROM ledger_entries WHERE case_id=:c AND seq>=1"), {"c": case["id"]}
    )
    db.commit()

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    truncation = next(e for e in report["errors"] if e["error"] == "CHAIN_TRUNCATED")
    assert truncation["seq"] == 1


def test_replacing_the_head_entry_is_detected(client, officers, case, statement, db):
    """Even a re-hashed replacement head fails: the audit log saw the real one."""
    db.execute(
        text("UPDATE ledger_entries SET entry_hash=:h WHERE case_id=:c AND seq=1"),
        {"h": "ab" * 32, "c": case["id"]},
    )
    db.commit()
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is False
    assert {e["error"] for e in report["errors"]} >= {
        "ENTRY_HASH_MISMATCH",
        "HEAD_HASH_MISMATCH",
    }


def test_swapping_the_stored_file_is_detected(client, officers, case, db):
    """The chain protects the record; re-hashing protects the bytes."""
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("notes.txt", io.BytesIO(b"original evidence bytes"), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "Field notes"},
    ).json()

    path = db.execute(
        text("SELECT storage_path FROM evidence WHERE uid=:u"), {"u": upload["uid"]}
    ).scalar_one()
    with open(path, "wb") as handle:
        handle.write(b"quietly swapped bytes")

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["chain_valid"] is True  # the record itself was not edited...
    assert report["files_valid"] is False  # ...but the file behind it was
    assert report["valid"] is False
    assert report["file_integrity"]["failures"][0]["error"] == "FILE_ALTERED"


def test_evidence_detail_reports_file_integrity(client, officers, case, statement):
    detail = client.get(
        f"/api/v1/evidence/{statement['uid']}", headers=officers["h_collector"]
    ).json()
    assert detail["integrity"]["committed_to_chain"] is True
    assert detail["integrity"]["content_hash_recorded"] == statement["content_hash"]


def test_text_hash_is_sha256_of_the_statement_bytes(statement):
    import hashlib

    expected = hashlib.sha256(
        "The suspect left the shop at about 9 PM.".encode("utf-8")
    ).hexdigest()
    assert statement["content_hash"] == expected

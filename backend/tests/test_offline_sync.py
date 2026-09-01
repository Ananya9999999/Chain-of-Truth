"""Offline-first logging and sync."""
from __future__ import annotations

import base64
import hashlib

from app.core.signing import offline_record_payload, sign_payload

PHOTO_BYTES = b"photo captured in a no-signal village"
PHOTO_B64 = base64.b64encode(PHOTO_BYTES).decode()
PHOTO_HASH = hashlib.sha256(PHOTO_BYTES).hexdigest()


def _record(case_number, **overrides):
    record = {
        "client_uuid": "offline-0001",
        "case_number": case_number,
        "evidence_type": "PHOTO",
        "title": "Scene photo logged offline",
        "file_base64": PHOTO_B64,
        "file_name": "scene.jpg",
        "content_type": "image/jpeg",
        "content_hash_client": PHOTO_HASH,
        "collected_at": "2026-08-29T21:05:00Z",
        "recorded_at_device": "2026-08-29T21:06:30Z",
        "device_metadata": {
            "device_id": "FIELD-TAB-04",
            "capture_timestamp": "2026-08-29T21:05:00Z",
            "gps_lat": 12.9716,
            "gps_lon": 77.5946,
        },
    }
    record.update(overrides)
    return record


def test_offline_record_is_ingested_and_chained(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"device_id": "FIELD-TAB-04", "records": [_record(case["case_number"])]},
    ).json()
    assert result["counts"] == {"created": 1, "duplicate_ignored": 0, "rejected": 0}
    created = result["results"][0]
    assert created["status"] == "created"
    assert created["content_hash"] == PHOTO_HASH

    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    assert any(e["event_type"] == "EVIDENCE_UPLOADED_OFFLINE_SYNC" for e in entries)


def test_original_timestamps_survive_the_sync(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_record(case["case_number"])]},
    ).json()["results"][0]

    assert result["collected_at"].startswith("2026-08-29T21:05:00")
    assert result["recorded_at_device"].startswith("2026-08-29T21:06:30")
    assert result["synced_at"] != result["collected_at"]

    detail = client.get(
        f"/api/v1/evidence/{result['evidence_uid']}", headers=officers["h_collector"]
    ).json()
    assert detail["was_offline"] is True
    assert detail["collected_at"].startswith("2026-08-29T21:05:00")


def test_resending_the_same_batch_does_not_duplicate(client, officers, case):
    payload = {"records": [_record(case["case_number"])]}
    first = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json=payload
    ).json()
    second = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json=payload
    ).json()

    assert second["counts"]["duplicate_ignored"] == 1
    assert second["results"][0]["evidence_uid"] == first["results"][0]["evidence_uid"]

    items = client.get(
        f"/api/v1/cases/{case['id']}/evidence", headers=officers["h_collector"]
    ).json()
    assert len(items) == 1


def test_hash_mismatch_is_rejected_before_anything_is_written(client, officers, case):
    """A file swapped in transit must not enter the record at all."""
    bad = _record(case["case_number"], file_base64=base64.b64encode(b"different").decode())
    result = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json={"records": [bad]}
    ).json()

    assert result["counts"]["rejected"] == 1
    assert result["results"][0]["reason"] == "CONTENT_HASH_MISMATCH"
    assert (
        client.get(
            f"/api/v1/cases/{case['id']}/evidence", headers=officers["h_collector"]
        ).json()
        == []
    )


def test_a_bad_record_does_not_block_the_rest_of_the_batch(client, officers, case):
    good = _record(case["case_number"], client_uuid="offline-good")
    bad = _record("CR-DOES-NOT-EXIST", client_uuid="offline-bad")
    result = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json={"records": [bad, good]}
    ).json()
    assert result["counts"]["created"] == 1
    assert result["counts"]["rejected"] == 1
    assert {r["reason"] for r in result["results"] if r["status"] == "rejected"} == {
        "CASE_NOT_FOUND"
    }


def test_device_seal_proves_the_original_timestamp(client, officers, case, db):
    from app.models import User

    officer = db.get(User, officers["collector"]["id"])
    signature = sign_payload(
        officer.private_key,
        offline_record_payload(
            client_uuid="offline-sealed",
            content_hash=PHOTO_HASH,
            recorded_at_device="2026-08-29T21:06:30.000000Z",
            officer_id=officer.id,
        ),
    )
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={
            "records": [
                _record(
                    case["case_number"],
                    client_uuid="offline-sealed",
                    offline_signature=signature,
                )
            ]
        },
    ).json()["results"][0]
    assert result["device_seal"] == {
        "present": True,
        "valid": True,
        "detail": "device seal verified against the officer's key",
    }


def test_unsealed_records_say_so_rather_than_implying_proof(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_record(case["case_number"])]},
    ).json()["results"][0]
    assert result["device_seal"]["present"] is False
    assert "not cryptographically proven" in result["device_seal"]["detail"]


def test_offline_evidence_still_needs_two_person_confirmation(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_record(case["case_number"])]},
    ).json()["results"][0]
    assert result["evidence_status"] == "PENDING_CONFIRMATION"


def test_sync_status_lists_late_arrivals(client, officers, case):
    client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_record(case["case_number"])]},
    )
    status = client.get("/api/v1/sync/status", headers=officers["h_collector"]).json()
    assert status["offline_logged_count"] == 1
    assert status["items"][0]["collected_at"].startswith("2026-08-29T21:05:00")


def test_chain_stays_valid_after_offline_sync(client, officers, case):
    client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_record(case["case_number"])]},
    )
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True

"""Adversarial QA pass: malformed, hostile and edge-case input.

Nothing here is a happy path. The bar is: the API answers with a sensible 4xx,
never a 500, never silent corruption, and the chain stays verifiable afterwards.
"""
from __future__ import annotations

import base64
import io
import json
from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import text


# --- identity ----------------------------------------------------------------


def test_unknown_officer_id_is_rejected(client, case):
    response = client.get(f"/api/v1/cases/{case['id']}", headers={"X-Officer-Id": "99999"})
    assert response.status_code == 401


def test_non_numeric_officer_header_does_not_crash(client, case):
    response = client.get(f"/api/v1/cases/{case['id']}", headers={"X-Officer-Id": "not-a-number"})
    assert 400 <= response.status_code < 500


def test_unknown_badge_number_is_rejected(client, case):
    response = client.get(
        f"/api/v1/cases/{case['id']}", headers={"X-Badge-Number": "NOPE-9999"}
    )
    assert response.status_code == 401


def test_deactivated_officer_cannot_act(client, officers, case, db):
    db.execute(
        text("UPDATE users SET is_active=0 WHERE id=:i"), {"i": officers["witness"]["id"]}
    )
    db.commit()
    response = client.get(f"/api/v1/cases/{case['id']}", headers=officers["h_witness"])
    assert response.status_code == 403


def test_every_write_route_requires_identity(client, case):
    """No mutation may be reachable anonymously."""
    for method, path, kwargs in [
        ("post", "/api/v1/cases", {"json": {"case_number": "X", "title": "X"}}),
        (
            "post",
            f"/api/v1/cases/{case['id']}/evidence/text",
            {"json": {"title": "X", "text_content": "X"}},
        ),
        ("post", "/api/v1/evidence/abc/confirm", {"json": {}}),
        ("post", "/api/v1/evidence/abc/reject", {"json": {"reason": "because"}}),
        ("post", "/api/v1/sync/batch", {"json": {"records": []}}),
        (
            "post",
            f"/api/v1/cases/{case['id']}/ledger/append",
            {"json": {"event_type": "CASE_NOTE", "payload": {}}},
        ),
    ]:
        response = getattr(client, method)(path, **kwargs)
        assert response.status_code == 401, f"{method.upper()} {path} was reachable anonymously"


# --- hostile input -----------------------------------------------------------


def test_path_traversal_in_filename_cannot_escape_storage(client, officers, case, db):
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("../../../../evil.txt", io.BytesIO(b"pwned"), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "Traversal attempt"},
    )
    assert upload.status_code == 201
    path = db.execute(
        text("SELECT storage_path FROM evidence WHERE uid=:u"), {"u": upload.json()["uid"]}
    ).scalar_one()
    assert ".." not in path
    assert "storage" in path.replace("\\", "/")


def test_path_traversal_in_case_number_cannot_escape_storage(client, officers):
    case = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "../../../etc", "title": "Traversal case"},
    ).json()
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("a.txt", io.BytesIO(b"x"), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "x"},
    )
    assert upload.status_code == 201
    assert ".." not in upload.json()["integrity"]["content_hash_recorded"]


def test_sql_injection_in_a_case_number_is_inert(client, officers):
    nasty = "CR'; DROP TABLE evidence;--"
    created = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": nasty, "title": "Injection attempt"},
    )
    assert created.status_code == 201
    # the table is still there and the case is retrievable by its literal number
    listed = client.get("/api/v1/cases", headers=officers["h_collector"])
    assert listed.status_code == 200
    assert any(c["case_number"] == nasty for c in listed.json())


def test_empty_file_upload_is_refused(client, officers, case):
    """A zero-byte file has a valid SHA-256 but is not evidence of anything."""
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "Nothing"},
    )
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_whitespace_only_statement_is_refused(client, officers, case):
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={"evidence_type": "WITNESS_STATEMENT", "title": "Blank", "text_content": "   \n\t "},
    )
    assert response.status_code == 422


def test_oversized_upload_is_refused_and_leaves_no_file(client, officers, case, monkeypatch):
    from app.services import storage

    monkeypatch.setattr(storage, "MAX_UPLOAD_BYTES", 32)
    before = set(storage.case_dir(case["case_number"]).iterdir())
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("big.bin", io.BytesIO(b"x" * 5000), "application/octet-stream")},
        data={"evidence_type": "DOCUMENT", "title": "Too big"},
    )
    assert response.status_code == 413
    assert set(storage.case_dir(case["case_number"]).iterdir()) == before


def test_device_metadata_must_be_a_json_object(client, officers, case):
    for bad in ["not json at all", "[1,2,3]", '"a string"', "42"]:
        response = client.post(
            f"/api/v1/cases/{case['id']}/evidence",
            headers=officers["h_collector"],
            files={"file": ("p.jpg", io.BytesIO(b"x"), "image/jpeg")},
            data={"evidence_type": "PHOTO", "title": "p", "device_metadata": bad},
        )
        assert response.status_code == 422, f"{bad!r} was accepted"


def test_garbage_gps_values_do_not_crash_the_cross_check(client, officers, case):
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("p.jpg", io.BytesIO(b"x"), "image/jpeg")},
        data={
            "evidence_type": "PHOTO",
            "title": "p",
            "device_metadata": json.dumps(
                {"device_id": "X", "gps_lat": "north-ish", "gps_lon": None}
            ),
        },
    )
    assert response.status_code == 201
    assert response.json()["device_metadata"]["gps_lat"] is None


def test_reject_reason_cannot_be_empty(client, officers, statement):
    response = client.post(
        f"/api/v1/evidence/{statement['uid']}/reject",
        headers=officers["h_witness"],
        json={"reason": "x"},
    )
    assert response.status_code == 422


def test_confirming_evidence_that_does_not_exist_is_a_404(client, officers):
    response = client.post(
        "/api/v1/evidence/00000000-0000-0000-0000-000000000000/confirm",
        headers=officers["h_witness"],
        json={},
    )
    assert response.status_code == 404


# --- unicode / multi-language ------------------------------------------------


@pytest.mark.parametrize(
    "statement_text",
    [
        "संदिग्ध रात करीब 9 बजे दुकान से निकला।",          # Hindi
        "ಶಂಕಿತನು ರಾತ್ರಿ 9 ಗಂಟೆಗೆ ಅಂಗಡಿಯಿಂದ ಹೊರಟನು.",        # Kannada
        "المشتبه به غادر المتجر حوالي الساعة 9 مساءً",      # Arabic
        "Suspect left at 9 PM 🕘 — witness unsure",         # emoji + em dash
    ],
)
def test_non_english_statements_hash_and_verify_correctly(
    client, officers, case, statement_text
):
    """The spec keeps regional-language statements in-language, so the hash
    must be stable over non-ASCII bytes."""
    import hashlib

    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Regional-language statement",
            "text_content": statement_text,
        },
    )
    assert upload.status_code == 201
    assert upload.json()["content_hash"] == hashlib.sha256(
        statement_text.encode("utf-8")
    ).hexdigest()

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True


def test_unicode_filename_is_stored_and_retrievable(client, officers, case):
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("साक्ष्य फोटो.jpg", io.BytesIO(b"bytes"), "image/jpeg")},
        data={"evidence_type": "DOCUMENT", "title": "Unicode filename"},
    ).json()
    download = client.get(
        f"/api/v1/evidence/{upload['uid']}/file", headers=officers["h_collector"]
    )
    assert download.status_code == 200
    assert download.content == b"bytes"


# --- duplicates and identity of content --------------------------------------


def test_identical_content_uploaded_twice_are_separate_items(client, officers, case):
    """Same bytes, two collections -- same hash, different records."""
    payload = {
        "evidence_type": "WITNESS_STATEMENT",
        "title": "Statement",
        "text_content": "identical text",
    }
    first = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json=payload,
    ).json()
    second = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json=payload,
    ).json()
    assert first["content_hash"] == second["content_hash"]
    assert first["uid"] != second["uid"]

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True


def test_duplicate_case_number_is_refused(client, officers, case):
    response = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": case["case_number"], "title": "Clash"},
    )
    assert response.status_code == 409


def test_duplicate_badge_number_is_refused(client, officers):
    response = client.post(
        "/api/v1/officers", json={"badge_number": "KA-1001", "full_name": "Impostor"}
    )
    assert response.status_code == 409


# --- offline sync edge cases -------------------------------------------------


def _offline(case_number, **overrides):
    body = b"offline bytes"
    import hashlib

    record = {
        "client_uuid": "adv-1",
        "case_number": case_number,
        "evidence_type": "DOCUMENT",
        "title": "Offline item",
        "file_base64": base64.b64encode(body).decode(),
        "file_name": "note.txt",
        "content_hash_client": hashlib.sha256(body).hexdigest(),
        "collected_at": "2026-08-29T21:05:00Z",
    }
    record.update(overrides)
    return record


def test_empty_sync_batch_is_accepted_and_does_nothing(client, officers):
    result = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json={"records": []}
    ).json()
    assert result["submitted"] == 0
    assert result["counts"] == {"created": 0, "duplicate_ignored": 0, "rejected": 0}


def test_duplicate_client_uuid_inside_one_batch_creates_one_record(
    client, officers, case
):
    """The retry guard has to work within a batch, not just across batches."""
    record = _offline(case["case_number"])
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [record, dict(record)]},
    ).json()
    assert result["counts"]["created"] == 1
    assert result["counts"]["duplicate_ignored"] == 1

    items = client.get(
        f"/api/v1/cases/{case['id']}/evidence", headers=officers["h_collector"]
    ).json()
    assert len([i for i in items if i["client_uuid"] == "adv-1"]) == 1


def test_offline_record_without_client_uuid_is_rejected(client, officers, case):
    record = _offline(case["case_number"])
    del record["client_uuid"]
    response = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json={"records": [record]}
    )
    assert response.status_code == 422  # schema requires it


def test_malformed_base64_is_rejected_cleanly(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={"records": [_offline(case["case_number"], file_base64="not!base64!")]},
    ).json()
    assert result["results"][0]["reason"] == "INVALID_BASE64"


def test_offline_record_for_an_unknown_officer_is_rejected(client, officers, case):
    result = client.post(
        "/api/v1/sync/batch",
        headers=officers["h_collector"],
        json={
            "records": [
                _offline(case["case_number"], collecting_officer_badge="GHOST-001")
            ]
        },
    ).json()
    assert result["results"][0]["reason"] == "OFFICER_NOT_FOUND"


def test_text_only_offline_record_verifies_its_hash(client, officers, case):
    import hashlib

    text_body = "logged in a village with no signal"
    record = _offline(
        case["case_number"],
        client_uuid="adv-text",
        file_base64=None,
        file_name=None,
        text_content=text_body,
        content_hash_client=hashlib.sha256(b"wrong bytes").hexdigest(),
    )
    result = client.post(
        "/api/v1/sync/batch", headers=officers["h_collector"], json={"records": [record]}
    ).json()
    assert result["results"][0]["reason"] == "CONTENT_HASH_MISMATCH"


# --- ledger query edge cases -------------------------------------------------


def test_since_seq_past_the_end_returns_nothing(client, officers, case, statement):
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger",
        headers=officers["h_collector"],
        params={"since_seq": 9999},
    ).json()
    assert entries == []


def test_verify_on_a_case_with_only_a_genesis_entry(client, officers):
    fresh = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "CR-EMPTY-1", "title": "Nothing logged yet"},
    ).json()
    report = client.get(
        f"/api/v1/cases/{fresh['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True
    assert report["entry_count"] == 1
    assert report["file_integrity"]["checked"] == 0


def test_ledger_append_with_a_deeply_nested_payload(client, officers, case):
    payload = {"level": {"a": [{"b": {"c": list(range(50))}}]}, "unicode": "फ्लैग"}
    response = client.post(
        f"/api/v1/cases/{case['id']}/ledger/append",
        headers=officers["h_collector"],
        json={"event_type": "AI_FLAG_RAISED", "payload": payload},
    )
    assert response.status_code == 201
    assert response.json()["payload"] == payload
    assert (
        client.get(
            f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
        ).json()["valid"]
        is True
    )


def test_repeated_downloads_keep_the_chain_valid(client, officers, case):
    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("r.txt", io.BytesIO(b"report"), "text/plain")},
        data={"evidence_type": "DOCUMENT", "title": "Report"},
    ).json()
    for _ in range(10):
        client.get(f"/api/v1/evidence/{upload['uid']}/file", headers=officers["h_witness"])
    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True
    assert report["entry_count"] >= 12


# --- concurrency -------------------------------------------------------------


def test_parallel_uploads_produce_a_contiguous_unbroken_chain(client, officers, case):
    """Sequence allocation under load: no gaps, no duplicates, still verifiable."""

    def upload(n: int):
        return client.post(
            f"/api/v1/cases/{case['id']}/evidence/text",
            headers=officers["h_collector"],
            json={
                "evidence_type": "WITNESS_STATEMENT",
                "title": f"Statement {n}",
                "text_content": f"content number {n}",
            },
        ).status_code

    with ThreadPoolExecutor(max_workers=8) as pool:
        codes = list(pool.map(upload, range(16)))
    assert codes == [201] * 16

    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger",
        headers=officers["h_collector"],
        params={"limit": 500},
    ).json()
    seqs = [e["seq"] for e in entries]
    assert seqs == list(range(len(seqs))), "sequence numbers are not contiguous"
    assert len(seqs) == len(set(seqs)), "duplicate sequence numbers"

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True


def test_parallel_confirmations_produce_exactly_one_witness(client, officers, case):
    """Two officers hitting confirm at once must not both sign."""
    third = client.post(
        "/api/v1/officers",
        json={"badge_number": "KA-1003", "full_name": "SI Third", "role": "SUPERVISOR"},
    ).json()
    statement = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Race target",
            "text_content": "race",
        },
    ).json()

    def confirm(officer_id: int):
        return client.post(
            f"/api/v1/evidence/{statement['uid']}/confirm",
            headers={"X-Officer-Id": str(officer_id)},
            json={},
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        codes = list(pool.map(confirm, [officers["witness"]["id"], third["id"]]))

    assert sorted(codes) == [200, 409], f"expected one winner and one refusal, got {codes}"
    detail = client.get(
        f"/api/v1/evidence/{statement['uid']}", headers=officers["h_collector"]
    ).json()
    assert len(detail["signatures"]) == 2
    assert detail["two_person_complete"] is True


def test_parallel_audit_writes_keep_the_audit_chain_intact(client, officers, case):
    def read(_n: int):
        return client.get(f"/api/v1/cases/{case['id']}", headers=officers["h_witness"]).status_code

    with ThreadPoolExecutor(max_workers=8) as pool:
        codes = list(pool.map(read, range(24)))
    assert set(codes) == {200}
    assert client.get("/api/v1/audit/verify", headers=officers["h_collector"]).json()["valid"]

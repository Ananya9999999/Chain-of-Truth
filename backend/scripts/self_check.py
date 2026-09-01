"""One-command proof that Part 1 does what the spec says.

    python scripts/self_check.py

Runs the whole Part 1 feature set against a throwaway database, then actively
tampers with it to prove the tamper-detection is real. Prints a plain-English
PASS/FAIL line per spec requirement. Touches nothing you already have -- it uses
a temporary directory that is deleted on exit.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_TMP = tempfile.mkdtemp(prefix="cot-selfcheck-")
os.environ["COT_DATABASE_URL"] = f"sqlite:///{_TMP}/check.db"
os.environ["COT_STORAGE_DIR"] = f"{_TMP}/storage"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402

PASSED: list[str] = []
FAILED: list[tuple[str, str]] = []


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        PASSED.append(label)
        print(f"  [PASS] {label}")
    else:
        FAILED.append((label, detail))
        print(f"  [FAIL] {label}  <-- {detail}")


def section(title: str) -> None:
    print(f"\n{title}")
    print("-" * len(title))


def main() -> int:
    init_db()
    client = TestClient(app)
    db = SessionLocal()

    section("1. Evidence upload API")
    anita = client.post(
        "/api/v1/officers",
        json={"badge_number": "KA-1001", "full_name": "Insp. Anita Rao"},
    ).json()
    bhaskar = client.post(
        "/api/v1/officers",
        json={"badge_number": "KA-1002", "full_name": "SI Bhaskar Nair", "role": "SUPERVISOR"},
    ).json()
    io_h = {"X-Officer-Id": str(anita["id"])}
    sup_h = {"X-Officer-Id": str(bhaskar["id"])}

    client.post(
        f"/api/v1/officers/{anita['id']}/shifts",
        headers=io_h,
        json={
            "started_at": "2026-08-29T18:00:00Z",
            "ended_at": "2026-08-30T06:00:00Z",
            "lat": 12.9716,
            "lon": 77.5946,
            "radius_m": 2500,
            "location_label": "MG Road PS beat",
        },
    )
    case = client.post(
        "/api/v1/cases",
        headers=io_h,
        json={"case_number": "CHK-001", "title": "Self-check case"},
    ).json()
    check("officer registration issues a signing keypair", len(anita["public_key"]) == 64)
    check("case can be opened", case["case_number"] == "CHK-001")

    statement = client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=io_h,
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Statement of R. Kumar",
            "text_content": "The suspect left the shop at about 9 PM.",
            "occurred_at": "2026-08-29T21:00:00Z",
        },
    )
    check("text evidence uploads", statement.status_code == 201, str(statement.status_code))
    statement = statement.json()

    photo = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=io_h,
        files={"file": ("scene.jpg", b"\xff\xd8\xff-scene-bytes", "image/jpeg")},
        data={
            "evidence_type": "PHOTO",
            "title": "Rear shutter",
            "device_metadata": json.dumps(
                {
                    "device_id": "PIXEL-7",
                    "capture_timestamp": "2026-08-29T23:40:00Z",
                    "gps_lat": 12.9718,
                    "gps_lon": 77.5949,
                }
            ),
        },
    )
    check("file evidence uploads", photo.status_code == 201, str(photo.status_code))
    photo = photo.json()

    section("2. SHA-256 hash chain")
    expected = hashlib.sha256(
        "The suspect left the shop at about 9 PM.".encode("utf-8")
    ).hexdigest()
    check("content hash is a real SHA-256 of the evidence", statement["content_hash"] == expected)

    entries = client.get(f"/api/v1/cases/{case['id']}/ledger", headers=io_h).json()
    check("chain starts at a genesis entry", entries[0]["prev_hash"] == "0" * 64)
    linked = all(
        b["prev_hash"] == a["entry_hash"] for a, b in zip(entries, entries[1:])
    )
    check("every entry chains to the previous one", linked)

    report = client.get(f"/api/v1/cases/{case['id']}/ledger/verify", headers=io_h).json()
    check("verification passes on an untouched chain", report["valid"] is True)

    section("3. Two-person confirmation")
    check(
        "upload starts unconfirmed with 1 of 2 signatures",
        statement["status"] == "PENDING_CONFIRMATION" and len(statement["signatures"]) == 1,
    )
    same = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm", headers=io_h, json={}
    )
    check("the same officer CANNOT confirm their own item", same.status_code == 409)

    confirmed = client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm", headers=sup_h, json={}
    ).json()
    check(
        "a second officer completes the confirmation",
        confirmed["status"] == "CONFIRMED" and confirmed["two_person_complete"],
    )
    check(
        "both Ed25519 signatures verify",
        all(s["valid"] for s in confirmed["signatures"]) and len(confirmed["signatures"]) == 2,
    )
    waive = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=io_h,
        files={"file": ("knife.txt", b"seized knife", "text/plain")},
        data={"evidence_type": "WEAPON", "title": "Knife", "requires_two_person": "false"},
    )
    check("two-person CANNOT be waived on physical evidence", waive.status_code == 422)

    section("4. Locked device metadata")
    no_meta = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=io_h,
        files={"file": ("p.jpg", b"x", "image/jpeg")},
        data={"evidence_type": "PHOTO", "title": "No metadata"},
    )
    check("a photo without device metadata is refused", no_meta.status_code == 422)
    check(
        "capture location matching the officer's shift is CONSISTENT",
        photo["device_metadata"]["cross_check_result"] == "CONSISTENT",
        photo["device_metadata"]["cross_check_result"],
    )
    far = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=io_h,
        files={"file": ("far.jpg", b"far-bytes", "image/jpeg")},
        data={
            "evidence_type": "PHOTO",
            "title": "Photo from 800km away",
            "device_metadata": json.dumps(
                {
                    "device_id": "PIXEL-7",
                    "capture_timestamp": "2026-08-29T23:40:00Z",
                    "gps_lat": 19.0760,
                    "gps_lon": 72.8777,
                }
            ),
        },
    ).json()
    check(
        "capture far from the logged shift is FLAGGED",
        far["device_metadata"]["cross_check_result"] == "FLAGGED",
    )
    check("locked metadata has no edit route anywhere in the API",
          not [p for p in client.get("/openapi.json").json()["paths"]
               if "metadata" in p.lower()])

    section("5. Audit trail on every view/access")
    client.get(f"/api/v1/evidence/{statement['uid']}", headers=sup_h)
    client.get("/api/v1/evidence/no-such-item", headers=sup_h)
    client.get("/api/v1/audit", headers=io_h, params={"limit": 500})
    # read twice: the first read's own VIEW_AUDIT_LOG entry is written after
    # that response is built, so it only shows up on the next read
    audit = client.get("/api/v1/audit", headers=io_h, params={"limit": 500}).json()
    actions = {a["action"] for a in audit}
    check("simply VIEWING evidence is logged", "VIEW_EVIDENCE" in actions)
    check("failed lookups are logged too",
          any(a["outcome"] == "NOT_FOUND" for a in audit))
    check("denied actions are logged", any(a["outcome"] == "DENIED" for a in audit))
    check("reading the audit log is itself logged", "VIEW_AUDIT_LOG" in actions)
    check("the audit log is hash-chained and intact",
          client.get("/api/v1/audit/verify", headers=io_h).json()["valid"] is True)

    section("6. Offline-first sync")
    photo_bytes = b"photo taken where there is no signal"
    record = {
        "client_uuid": "chk-offline-1",
        "case_number": "CHK-001",
        "evidence_type": "PHOTO",
        "title": "Logged offline",
        "file_base64": base64.b64encode(photo_bytes).decode(),
        "file_name": "offline.jpg",
        "content_hash_client": hashlib.sha256(photo_bytes).hexdigest(),
        "collected_at": "2026-08-29T21:05:00Z",
        "recorded_at_device": "2026-08-29T21:06:30Z",
        "device_metadata": {
            "device_id": "FIELD-TAB-04",
            "capture_timestamp": "2026-08-29T21:05:00Z",
            "gps_lat": 12.9716,
            "gps_lon": 77.5946,
        },
    }
    first = client.post(
        "/api/v1/sync/batch", headers=io_h, json={"records": [record]}
    ).json()
    check("offline records sync in", first["counts"]["created"] == 1)
    check(
        "the ORIGINAL collection time survives the sync",
        first["results"][0]["collected_at"].startswith("2026-08-29T21:05:00"),
    )
    again = client.post(
        "/api/v1/sync/batch", headers=io_h, json={"records": [record]}
    ).json()
    check("re-sending the same batch does not duplicate",
          again["counts"]["duplicate_ignored"] == 1)

    tampered = dict(record, client_uuid="chk-offline-2",
                    file_base64=base64.b64encode(b"swapped file").decode())
    bad = client.post(
        "/api/v1/sync/batch", headers=io_h, json={"records": [tampered]}
    ).json()
    check(
        "a file swapped in transit is rejected",
        bad["results"][0].get("reason") == "CONTENT_HASH_MISMATCH",
    )

    section("7. Tamper detection (actively breaking things)")
    check("chain is valid before we tamper",
          client.get(f"/api/v1/cases/{case['id']}/ledger/verify",
                     headers=io_h).json()["valid"] is True)

    db.execute(
        text("UPDATE evidence SET text_content=:t WHERE uid=:u"),
        {"t": "The suspect left the shop at about 11 PM.", "u": statement["uid"]},
    )
    db.commit()
    r = client.get(f"/api/v1/cases/{case['id']}/ledger/verify", headers=io_h).json()
    check(
        "rewriting a witness statement in the database is CAUGHT",
        r["valid"] is False
        and any(f["error"] == "TEXT_ALTERED" for f in r["file_integrity"]["failures"]),
    )
    db.execute(
        text("UPDATE evidence SET text_content=:t WHERE uid=:u"),
        {"t": "The suspect left the shop at about 9 PM.", "u": statement["uid"]},
    )
    db.commit()

    path = db.execute(
        text("SELECT storage_path FROM evidence WHERE uid=:u"), {"u": photo["uid"]}
    ).scalar_one()
    original = Path(path).read_bytes()
    Path(path).write_bytes(b"a completely different photo")
    r = client.get(f"/api/v1/cases/{case['id']}/ledger/verify", headers=io_h).json()
    check(
        "swapping the file behind a record is CAUGHT",
        r["valid"] is False
        and any(f["error"] == "FILE_ALTERED" for f in r["file_integrity"]["failures"]),
    )
    Path(path).write_bytes(original)

    db.execute(
        text("UPDATE ledger_entries SET payload=:p WHERE case_id=:c AND seq=1"),
        {"p": json.dumps({"tampered": True}), "c": case["id"]},
    )
    db.commit()
    r = client.get(f"/api/v1/cases/{case['id']}/ledger/verify", headers=io_h).json()
    check(
        "editing a past ledger entry is CAUGHT",
        r["valid"] is False
        and any(e["error"] == "PAYLOAD_ALTERED" for e in r["errors"]),
    )

    head_seq = db.execute(
        text("SELECT MAX(seq) FROM ledger_entries WHERE case_id=:c"), {"c": case["id"]}
    ).scalar_one()
    db.execute(
        text("DELETE FROM ledger_entries WHERE case_id=:c AND seq>=:s"),
        {"c": case["id"], "s": head_seq - 1},
    )
    db.commit()
    r = client.get(f"/api/v1/cases/{case['id']}/ledger/verify", headers=io_h).json()
    check(
        "chopping entries off the END of the chain is CAUGHT",
        any(e["error"] == "CHAIN_TRUNCATED" for e in r["errors"]),
    )

    db.execute(text("UPDATE evidence_signatures SET signature=:s WHERE signer_role='WITNESSING_OFFICER'"),
               {"s": "00" * 64})
    db.commit()
    detail = client.get(f"/api/v1/evidence/{statement['uid']}", headers=io_h).json()
    check(
        "a forged officer signature fails verification",
        detail["two_person_complete"] is False
        and not all(s["valid"] for s in detail["signatures"]),
    )

    db.execute(text("DELETE FROM audit_log WHERE action='VIEW_EVIDENCE'"))
    db.commit()
    check(
        "deleting an access-log record is CAUGHT",
        client.get("/api/v1/audit/verify", headers=io_h).json()["valid"] is False,
    )

    db.close()

    print("\n" + "=" * 62)
    print(f"  {len(PASSED)} passed, {len(FAILED)} failed")
    print("=" * 62)
    if FAILED:
        for label, detail in FAILED:
            print(f"  FAILED: {label} ({detail})")
        return 1
    print("  Part 1 is behaving exactly as the spec describes.")
    return 0


if __name__ == "__main__":
    try:
        code = main()
    finally:
        shutil.rmtree(_TMP, ignore_errors=True)
    sys.exit(code)

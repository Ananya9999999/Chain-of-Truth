"""Offline-first sync.

The loophole this closes: a rural station with no connectivity cannot log
evidence at the moment of collection, so timestamps get back-filled hours later
and the whole chain-of-custody claim weakens.

How it works here:
  * The field device logs the item locally, hashes the bytes itself, and (if it
    holds the officer's key) signs {client_uuid, content_hash,
    recorded_at_device}. That seals the record before it can reach us.
  * On reconnect the device POSTs the batch. The server re-hashes the bytes and
    rejects the record outright if the digest does not match what the device
    claimed -- a corrupted or swapped file cannot slip in during transit.
  * The original collection/device timestamps are preserved on the record; the
    server additionally stamps synced_at.

Honest limitation, worth saying out loud in the pitch: the *chain position* is
necessarily the sync time, because you cannot insert into a hash chain
retroactively without breaking it. So the ledger shows "this arrived late, and
here is the device's own sealed claim about when it was actually collected"
rather than pretending the server saw it earlier. Ordering by event time is the
timeline's job (Part 2/4); ordering by chain position is the ledger's.

Re-sending the same batch is safe: client_uuid is unique, so a retry after a
dropped connection returns the existing record instead of duplicating it.
"""
from __future__ import annotations

import base64
import io

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.canonical import sha256_hex, to_iso, utc_now_iso
from ..core.signing import offline_record_payload, verify_payload
from ..models import Case, Evidence, User
from . import evidence as evidence_service
from . import ledger

STATUS_CREATED = "created"
STATUS_DUPLICATE = "duplicate_ignored"
STATUS_REJECTED = "rejected"


def sync_batch(db: Session, *, records: list[dict], syncing_officer: User, device_id: str | None = None) -> dict:
    """Ingest a batch of offline-logged records. Idempotent per client_uuid."""
    results: list[dict] = []
    for record in records:
        try:
            results.append(
                _sync_one(db, record=record, syncing_officer=syncing_officer, device_id=device_id)
            )
        except evidence_service.EvidenceError as exc:
            db.rollback()
            results.append(
                {
                    "client_uuid": record.get("client_uuid"),
                    "status": STATUS_REJECTED,
                    "reason": exc.code,
                    "detail": exc.message,
                }
            )

    counts = {
        "created": sum(1 for r in results if r["status"] == STATUS_CREATED),
        "duplicate_ignored": sum(1 for r in results if r["status"] == STATUS_DUPLICATE),
        "rejected": sum(1 for r in results if r["status"] == STATUS_REJECTED),
    }
    return {
        "device_id": device_id,
        "synced_at": utc_now_iso(),
        "submitted": len(records),
        "counts": counts,
        "results": results,
    }


def _sync_one(
    db: Session, *, record: dict, syncing_officer: User, device_id: str | None
) -> dict:
    client_uuid = record.get("client_uuid")
    if not client_uuid:
        raise evidence_service.EvidenceError(
            "client_uuid is required for offline records",
            status_code=422,
            code="MISSING_CLIENT_UUID",
        )

    existing = db.execute(
        select(Evidence).where(Evidence.client_uuid == client_uuid)
    ).scalar_one_or_none()
    if existing is not None:
        # Retry of an already-accepted record. Never duplicate, never re-chain.
        return {
            "client_uuid": client_uuid,
            "status": STATUS_DUPLICATE,
            "evidence_uid": existing.uid,
            "evidence_id": existing.id,
            "detail": "record already synced; no new ledger entry written",
        }

    case = _resolve_case(db, record)

    file_stream = None
    file_bytes = None
    file_name = record.get("file_name")
    if record.get("file_base64"):
        try:
            file_bytes = base64.b64decode(record["file_base64"], validate=True)
        except (ValueError, TypeError) as exc:
            raise evidence_service.EvidenceError(
                "file_base64 is not valid base64",
                status_code=422,
                code="INVALID_BASE64",
            ) from exc
        file_stream = io.BytesIO(file_bytes)

    # Verify the device's own hash claim before anything is written.
    claimed_hash = record.get("content_hash_client")
    if claimed_hash:
        if file_bytes is not None:
            actual = sha256_hex(file_bytes)
        elif record.get("text_content"):
            actual = sha256_hex(record["text_content"].encode("utf-8"))
        else:
            actual = None
        if actual is not None and actual != claimed_hash.lower():
            raise evidence_service.EvidenceError(
                "content hash computed on the device does not match the bytes "
                f"received (device claimed {claimed_hash}, server computed {actual})",
                status_code=409,
                code="CONTENT_HASH_MISMATCH",
            )

    collecting_officer = _resolve_officer(db, record, default=syncing_officer)

    evidence = evidence_service.log_evidence(
        db,
        case=case,
        collecting_officer=collecting_officer,
        evidence_type=record.get("evidence_type", "OTHER"),
        title=record.get("title") or "Offline-logged evidence",
        description=record.get("description"),
        text_content=record.get("text_content"),
        file_stream=file_stream,
        file_name=file_name,
        content_type=record.get("content_type"),
        occurred_at=record.get("occurred_at"),
        collected_at=record.get("collected_at"),
        collection_lat=record.get("collection_lat"),
        collection_lon=record.get("collection_lon"),
        device_metadata=record.get("device_metadata"),
        two_person_override=record.get("requires_two_person"),
        was_offline=True,
        client_uuid=client_uuid,
        recorded_at_device=record.get("recorded_at_device"),
    )

    device_seal = _check_device_seal(record, evidence=evidence, officer=collecting_officer)

    return {
        "client_uuid": client_uuid,
        "status": STATUS_CREATED,
        "evidence_uid": evidence.uid,
        "evidence_id": evidence.id,
        "case_number": case.case_number,
        "content_hash": evidence.content_hash,
        "collected_at": evidence.collected_at,
        "recorded_at_device": evidence.recorded_at_device,
        "synced_at": evidence.synced_at,
        "evidence_status": evidence.status,
        "device_seal": device_seal,
        "ledger": ledger.chain_stats(db, case.id),
    }


def _check_device_seal(record: dict, *, evidence: Evidence, officer: User) -> dict:
    """Verify the on-device signature over the original timestamp, if supplied."""
    signature = record.get("offline_signature")
    if not signature:
        return {
            "present": False,
            "valid": None,
            "detail": "device did not seal this record; original timestamp is "
            "asserted by the device but not cryptographically proven",
        }
    payload = offline_record_payload(
        client_uuid=evidence.client_uuid,
        content_hash=evidence.content_hash,
        recorded_at_device=evidence.recorded_at_device or "",
        officer_id=officer.id,
    )
    valid = verify_payload(officer.public_key, payload, signature)
    return {
        "present": True,
        "valid": valid,
        "detail": "device seal verified against the officer's key"
        if valid
        else "device seal did NOT verify -- treat the original timestamp as unproven",
    }


def _resolve_case(db: Session, record: dict) -> Case:
    if record.get("case_id"):
        case = db.get(Case, record["case_id"])
    elif record.get("case_number"):
        case = db.execute(
            select(Case).where(Case.case_number == record["case_number"])
        ).scalar_one_or_none()
    else:
        raise evidence_service.EvidenceError(
            "each offline record needs case_id or case_number",
            status_code=422,
            code="MISSING_CASE",
        )
    if case is None:
        raise evidence_service.EvidenceError(
            "case not found for offline record", status_code=404, code="CASE_NOT_FOUND"
        )
    return case


def _resolve_officer(db: Session, record: dict, *, default: User) -> User:
    if record.get("collecting_officer_id"):
        officer = db.get(User, record["collecting_officer_id"])
    elif record.get("collecting_officer_badge"):
        officer = db.execute(
            select(User).where(User.badge_number == record["collecting_officer_badge"])
        ).scalar_one_or_none()
    else:
        return default
    if officer is None:
        raise evidence_service.EvidenceError(
            "collecting officer not found", status_code=404, code="OFFICER_NOT_FOUND"
        )
    return officer


def pending_sync_summary(db: Session) -> dict:
    """What arrived late, for the 'offline-first' talking point in the demo."""
    offline_items = list(
        db.execute(select(Evidence).where(Evidence.was_offline.is_(True))).scalars()
    )
    return {
        "offline_logged_count": len(offline_items),
        "items": [
            {
                "evidence_uid": item.uid,
                "case_id": item.case_id,
                "collected_at": item.collected_at,
                "recorded_at_device": item.recorded_at_device,
                "synced_at": item.synced_at,
                "delay_note": "chain position reflects sync time; "
                "collected_at is the device's original claim",
            }
            for item in offline_items
        ],
        "generated_at": to_iso(utc_now_iso()),
    }

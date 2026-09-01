"""Evidence logging and the two-person confirmation flow.

Flow for physical evidence (the spec's mandatory rule):

    collecting officer uploads  -> PENDING_CONFIRMATION, signature 1 of 2
    witnessing officer confirms -> CONFIRMED,            signature 2 of 2
                                   both signatures hashed into the ledger

Until an item is CONFIRMED it is not part of the verified case record. Parts 2-4
read ``status=CONFIRMED`` to decide what counts as an established case fact.
"""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import BinaryIO

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import DEVICE_METADATA_REQUIRED_TYPES, PHYSICAL_EVIDENCE_TYPES
from ..core.canonical import hash_payload, sha256_hex, to_iso, utc_now_iso
from ..core.locks import write_lock
from ..core.signing import attestation_payload, sign_payload, verify_payload
from ..models import (
    EVIDENCE_STATUS_CONFIRMED,
    EVIDENCE_STATUS_PENDING,
    EVIDENCE_STATUS_REJECTED,
    SIGNER_ROLE_COLLECTING,
    SIGNER_ROLE_WITNESSING,
    Case,
    Evidence,
    EvidenceSignature,
    User,
)
from . import device_metadata as device_metadata_service
from . import ledger, storage


class EvidenceError(Exception):
    """Business-rule violation, mapped to an HTTP status by the API layer."""

    def __init__(self, message: str, status_code: int = 400, code: str = "EVIDENCE_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def requires_two_person(evidence_type: str, override: bool | None = None) -> bool:
    """Two-person confirmation is the default for anything entering a case record.

    For the physical-evidence categories the spec calls out it is *mandatory*:
    the override is refused rather than silently ignored, so nobody can log a
    seized weapon single-handed by passing a flag.
    """
    if evidence_type.upper() in PHYSICAL_EVIDENCE_TYPES:
        if override is False:
            raise EvidenceError(
                f"two-person confirmation is mandatory for {evidence_type.upper()} "
                "and cannot be waived",
                status_code=422,
                code="TWO_PERSON_MANDATORY",
            )
        return True
    return True if override is None else bool(override)


def _parse_timestamp(value: str | None, field: str) -> str | None:
    """Normalise a client-supplied timestamp, or refuse it with a clear 422."""
    if not value:
        return None
    try:
        return to_iso(value)
    except (ValueError, TypeError) as exc:
        raise EvidenceError(
            f"{field} must be an ISO-8601 timestamp (e.g. 2026-08-29T21:00:00Z), got {value!r}",
            status_code=422,
            code="INVALID_TIMESTAMP",
        ) from exc


def _sign_as(db: Session, *, evidence: Evidence, officer: User, role: str) -> EvidenceSignature:
    signed_at = utc_now_iso()
    payload = attestation_payload(
        evidence_uid=evidence.uid,
        content_hash=evidence.content_hash,
        role=role,
        officer_id=officer.id,
        signed_at=signed_at,
    )
    signature = EvidenceSignature(
        evidence_id=evidence.id,
        signer_id=officer.id,
        signer_role=role,
        signature=sign_payload(officer.private_key, payload),
        signed_payload_hash=hash_payload(payload),
        signed_at=signed_at,
    )
    db.add(signature)
    db.flush()
    return signature


def verify_signatures(db: Session, evidence: Evidence) -> list[dict]:
    """Re-verify every attestation against the signer's public key."""
    results = []
    for signature in evidence.signatures:
        signer = db.get(User, signature.signer_id)
        payload = attestation_payload(
            evidence_uid=evidence.uid,
            content_hash=evidence.content_hash,
            role=signature.signer_role,
            officer_id=signature.signer_id,
            signed_at=signature.signed_at,
        )
        results.append(
            {
                "role": signature.signer_role,
                "officer_id": signature.signer_id,
                "officer_name": signer.full_name if signer else None,
                "badge_number": signer.badge_number if signer else None,
                "signed_at": signature.signed_at,
                "signature": signature.signature,
                "valid": bool(signer)
                and verify_payload(signer.public_key, payload, signature.signature),
            }
        )
    return sorted(results, key=lambda r: r["signed_at"])


def log_evidence(
    db: Session,
    *,
    case: Case,
    collecting_officer: User,
    evidence_type: str,
    title: str,
    description: str | None = None,
    text_content: str | None = None,
    file_stream: BinaryIO | None = None,
    file_name: str | None = None,
    content_type: str | None = None,
    occurred_at: str | None = None,
    collected_at: str | None = None,
    collection_lat: float | None = None,
    collection_lon: float | None = None,
    device_metadata: dict | None = None,
    two_person_override: bool | None = None,
    # offline-first fields
    was_offline: bool = False,
    client_uuid: str | None = None,
    recorded_at_device: str | None = None,
) -> Evidence:
    """Log one evidence item: store bytes, hash them, sign, chain, lock metadata."""
    evidence_type = evidence_type.lower().strip()
    if not text_content and file_stream is None:
        raise EvidenceError(
            "evidence must carry either a file or text_content",
            status_code=422,
            code="EMPTY_EVIDENCE",
        )
    if text_content is not None and not text_content.strip():
        raise EvidenceError(
            "text_content is empty -- whitespace is not a statement",
            status_code=422,
            code="EMPTY_EVIDENCE",
        )
    if text_content and file_stream is not None:
        # The content hash can only commit to one of them, and anything it does
        # not cover would be editable without verification noticing. Log the
        # transcript as its own evidence item instead.
        raise EvidenceError(
            "an evidence item carries either a file or text_content, not both -- "
            "the content hash must cover everything evidentiary",
            status_code=422,
            code="AMBIGUOUS_CONTENT",
        )
    if evidence_type in DEVICE_METADATA_REQUIRED_TYPES and not device_metadata:
        raise EvidenceError(
            f"{evidence_type} requires locked device metadata "
            "(device_id, capture_timestamp, GPS) at upload",
            status_code=422,
            code="DEVICE_METADATA_REQUIRED",
        )

    # Resolved before any bytes are written so a refused upload leaves no
    # orphan file behind on disk.
    two_person = requires_two_person(evidence_type, two_person_override)

    occurred_at_iso = _parse_timestamp(occurred_at, "occurred_at")
    collected_at_iso = _parse_timestamp(collected_at, "collected_at")
    recorded_at_device_iso = _parse_timestamp(recorded_at_device, "recorded_at_device")

    uid = str(uuid.uuid4())
    uploaded_at = utc_now_iso()

    storage_path = None
    file_size = None
    if file_stream is not None:
        try:
            storage_path, content_hash, file_size = storage.store_stream(
                file_stream,
                case_number=case.case_number,
                evidence_uid=uid,
                file_name=file_name or "evidence.bin",
            )
        except storage.UploadTooLarge as exc:
            raise EvidenceError(str(exc), status_code=413, code="UPLOAD_TOO_LARGE") from exc
        if file_size == 0:
            # A zero-byte file has a perfectly valid SHA-256 and proves nothing.
            # Refuse it rather than let an empty record claim to be evidence.
            Path(storage_path).unlink(missing_ok=True)
            raise EvidenceError(
                "the uploaded file is empty (0 bytes)",
                status_code=422,
                code="EMPTY_EVIDENCE",
            )
    else:
        # Text-only evidence is hashed over its exact UTF-8 bytes.
        content_hash = sha256_hex(text_content.encode("utf-8"))

    evidence = Evidence(
        uid=uid,
        case_id=case.id,
        evidence_type=evidence_type,
        title=title,
        description=description,
        text_content=text_content,
        file_name=file_name,
        file_size=file_size,
        content_type=content_type,
        storage_path=storage_path,
        content_hash=content_hash,
        occurred_at=occurred_at_iso,
        collected_at=collected_at_iso or uploaded_at,
        uploaded_at=uploaded_at,
        collection_lat=collection_lat,
        collection_lon=collection_lon,
        collecting_officer_id=collecting_officer.id,
        status=EVIDENCE_STATUS_PENDING if two_person else EVIDENCE_STATUS_CONFIRMED,
        requires_two_person=two_person,
        confirmed_at=None if two_person else uploaded_at,
        was_offline=was_offline,
        client_uuid=client_uuid,
        recorded_at_device=recorded_at_device_iso,
        synced_at=uploaded_at if was_offline else None,
    )
    # One writer at a time: the evidence row, its signature, its device metadata
    # and its chain entry are a single write transaction, so two concurrent
    # uploads queue instead of colliding on the database.
    with write_lock:
        db.add(evidence)
        db.flush()

        collecting_signature = _sign_as(
            db, evidence=evidence, officer=collecting_officer, role=SIGNER_ROLE_COLLECTING
        )

        metadata_row = None
        if device_metadata:
            metadata_row = device_metadata_service.lock_metadata(
                db, evidence=evidence, raw=device_metadata
            )

        payload = _upload_payload(
            evidence,
            collecting_officer=collecting_officer,
            collecting_signature=collecting_signature,
            metadata_row=metadata_row,
            two_person=two_person,
            was_offline=was_offline,
            client_uuid=client_uuid,
        )
        ledger.append_entry(
            db,
            case=case,
            event_type=ledger.EVENT_EVIDENCE_UPLOADED_OFFLINE
            if was_offline
            else ledger.EVENT_EVIDENCE_UPLOADED,
            payload=payload,
            actor_id=collecting_officer.id,
            evidence_id=evidence.id,
        )
        db.refresh(evidence)
    return evidence


def _upload_payload(
    evidence: Evidence,
    *,
    collecting_officer: User,
    collecting_signature: EvidenceSignature,
    metadata_row,
    two_person: bool,
    was_offline: bool,
    client_uuid: str | None,
) -> dict:
    """Everything about this upload that the chain entry commits to."""
    return {
        "evidence_uid": evidence.uid,
        "evidence_type": evidence.evidence_type,
        "title": evidence.title,
        "description": evidence.description,
        "content_type": evidence.content_type,
        "content_hash": evidence.content_hash,
        "file_name": evidence.file_name,
        "file_size": evidence.file_size,
        "occurred_at": evidence.occurred_at,
        "collected_at": evidence.collected_at,
        "uploaded_at": evidence.uploaded_at,
        "collecting_officer": {
            "id": collecting_officer.id,
            "badge_number": collecting_officer.badge_number,
        },
        "collecting_signature": collecting_signature.signature,
        "requires_two_person": two_person,
        "status": evidence.status,
        "collection_location": {
            "lat": evidence.collection_lat,
            "lon": evidence.collection_lon,
        },
        "device_metadata": None
        if metadata_row is None
        else {
            "metadata_hash": metadata_row.metadata_hash,
            "device_id": metadata_row.device_id,
            "capture_timestamp": metadata_row.capture_timestamp,
            "cross_check_result": metadata_row.cross_check_result,
            "cross_check_distance_m": metadata_row.cross_check_distance_m,
        },
        "offline": {
            "was_offline": was_offline,
            "client_uuid": client_uuid,
            "recorded_at_device": evidence.recorded_at_device,
            "synced_at": evidence.synced_at,
        }
        if was_offline
        else None,
    }


def confirm_evidence(
    db: Session, *, evidence: Evidence, witnessing_officer: User, note: str | None = None
) -> Evidence:
    """Second-person confirmation. Enforced cryptographically, not by a flag."""
    if evidence.status == EVIDENCE_STATUS_CONFIRMED:
        raise EvidenceError(
            "evidence is already confirmed", status_code=409, code="ALREADY_CONFIRMED"
        )
    if evidence.status == EVIDENCE_STATUS_REJECTED:
        raise EvidenceError(
            "evidence was rejected and cannot be confirmed",
            status_code=409,
            code="ALREADY_REJECTED",
        )
    if witnessing_officer.id == evidence.collecting_officer_id:
        raise EvidenceError(
            "the two-person rule requires a different officer than the one who "
            "logged the item",
            status_code=409,
            code="SAME_OFFICER",
        )
    if not witnessing_officer.is_active:
        raise EvidenceError(
            "witnessing officer account is not active", status_code=403, code="INACTIVE_OFFICER"
        )

    with write_lock:
        return _apply_confirmation(
            db, evidence=evidence, witnessing_officer=witnessing_officer, note=note
        )


def _apply_confirmation(
    db: Session, *, evidence: Evidence, witnessing_officer: User, note: str | None
) -> Evidence:
    # Re-check inside the lock: another officer may have confirmed while we
    # were queued behind them.
    db.refresh(evidence)
    if evidence.status == EVIDENCE_STATUS_CONFIRMED:
        raise EvidenceError(
            "evidence is already confirmed", status_code=409, code="ALREADY_CONFIRMED"
        )
    try:
        witness_signature = _sign_as(
            db, evidence=evidence, officer=witnessing_officer, role=SIGNER_ROLE_WITNESSING
        )
    except IntegrityError as exc:
        # UNIQUE(evidence_id, signer_role): another officer confirmed between
        # our status check and this insert.
        db.rollback()
        raise EvidenceError(
            "evidence was confirmed by another officer moments ago",
            status_code=409,
            code="ALREADY_CONFIRMED",
        ) from exc
    collecting_signature = next(
        (s for s in evidence.signatures if s.signer_role == SIGNER_ROLE_COLLECTING), None
    )

    evidence.witnessing_officer_id = witnessing_officer.id
    evidence.status = EVIDENCE_STATUS_CONFIRMED
    evidence.confirmed_at = utc_now_iso()
    db.flush()

    ledger.append_entry(
        db,
        case=evidence.case,
        event_type=ledger.EVENT_EVIDENCE_CONFIRMED,
        payload={
            "evidence_uid": evidence.uid,
            "content_hash": evidence.content_hash,
            "confirmed_at": evidence.confirmed_at,
            "note": note,
            "collecting_officer_id": evidence.collecting_officer_id,
            "witnessing_officer": {
                "id": witnessing_officer.id,
                "badge_number": witnessing_officer.badge_number,
            },
            "signatures": {
                SIGNER_ROLE_COLLECTING: collecting_signature.signature
                if collecting_signature
                else None,
                SIGNER_ROLE_WITNESSING: witness_signature.signature,
            },
        },
        actor_id=witnessing_officer.id,
        evidence_id=evidence.id,
    )
    db.refresh(evidence)
    return evidence


def reject_evidence(
    db: Session, *, evidence: Evidence, officer: User, reason: str
) -> Evidence:
    """A witnessing officer declines to attest. Recorded, never deleted."""
    if evidence.status != EVIDENCE_STATUS_PENDING:
        raise EvidenceError(
            f"only pending evidence can be rejected (status={evidence.status})",
            status_code=409,
            code="NOT_PENDING",
        )
    if officer.id == evidence.collecting_officer_id:
        raise EvidenceError(
            "rejection must come from an officer other than the one who logged it",
            status_code=409,
            code="SAME_OFFICER",
        )

    with write_lock:
        evidence.status = EVIDENCE_STATUS_REJECTED
        evidence.rejection_reason = reason
        db.flush()
        _append_rejection(db, evidence=evidence, officer=officer, reason=reason)
    db.refresh(evidence)
    return evidence


def _append_rejection(db: Session, *, evidence: Evidence, officer: User, reason: str) -> None:
    ledger.append_entry(
        db,
        case=evidence.case,
        event_type=ledger.EVENT_EVIDENCE_REJECTED,
        payload={
            "evidence_uid": evidence.uid,
            "content_hash": evidence.content_hash,
            "reason": reason,
            "rejected_by": {"id": officer.id, "badge_number": officer.badge_number},
            "rejected_at": utc_now_iso(),
        },
        actor_id=officer.id,
        evidence_id=evidence.id,
    )

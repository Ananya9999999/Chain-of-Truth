"""Evidence upload, two-person confirmation, and audited reads."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    EVIDENCE_STATUS_CONFIRMED,
    SIGNER_ROLE_COLLECTING,
    SIGNER_ROLE_WITNESSING,
    Evidence,
    LedgerEntry,
    User,
)
from ..schemas import ConfirmRequest, EvidenceDetail, EvidenceOut, RejectRequest, TextEvidenceCreate
from ..services import audit, ledger
from ..services import evidence as evidence_service
from .deps import (
    RequestContext,
    db_session,
    get_case_or_404,
    get_current_user,
    get_evidence_or_404,
    request_context,
)

router = APIRouter(tags=["evidence"])


# --- helpers -----------------------------------------------------------------


def _device_metadata_out(evidence: Evidence) -> dict | None:
    row = evidence.device_metadata
    if row is None:
        return None
    return {
        "device_id": row.device_id,
        "device_model": row.device_model,
        "capture_timestamp": row.capture_timestamp,
        "gps_lat": row.gps_lat,
        "gps_lon": row.gps_lon,
        "gps_accuracy_m": row.gps_accuracy_m,
        "metadata_hash": row.metadata_hash,
        "locked_at": row.locked_at,
        "cross_check_result": row.cross_check_result,
        "cross_check_distance_m": row.cross_check_distance_m,
        "checks": json.loads(row.cross_check_detail or "[]"),
    }


def _integrity(db: Session, evidence: Evidence) -> dict:
    """Is the content still what we hashed, and is the record in the chain?

    Covers text evidence as well as files -- a witness statement is content too.
    """
    hash_now, error = ledger.recompute_content_hash(evidence)
    content_intact = None if error == "NO_CONTENT" else (hash_now == evidence.content_hash)
    chained = db.execute(
        select(LedgerEntry).where(
            LedgerEntry.evidence_id == evidence.id,
            LedgerEntry.event_type.in_(
                [ledger.EVENT_EVIDENCE_UPLOADED, ledger.EVENT_EVIDENCE_UPLOADED_OFFLINE]
            ),
        )
    ).scalar_one_or_none()
    return {
        "content_hash_recorded": evidence.content_hash,
        "content_hash_recomputed": hash_now,
        "content_kind": "FILE" if evidence.storage_path else "TEXT",
        "content_intact": content_intact,
        # kept under the old name too so the UI does not have to branch
        "file_intact": content_intact,
        "committed_to_chain": chained is not None,
        "chain_entry_hash": chained.entry_hash if chained else None,
        "chain_seq": chained.seq if chained else None,
    }


def _detail(db: Session, evidence: Evidence) -> dict:
    signatures = evidence_service.verify_signatures(db, evidence)
    roles_present = {s["role"] for s in signatures if s["valid"]}
    two_person_complete = (
        SIGNER_ROLE_COLLECTING in roles_present and SIGNER_ROLE_WITNESSING in roles_present
    )
    entries = list(
        db.execute(
            select(LedgerEntry)
            .where(LedgerEntry.evidence_id == evidence.id)
            .order_by(LedgerEntry.seq)
        ).scalars()
    )
    return {
        **{c.name: getattr(evidence, c.name) for c in evidence.__table__.columns},
        "signatures": signatures,
        "two_person_complete": two_person_complete,
        "device_metadata": _device_metadata_out(evidence),
        "ledger_entries": [
            {
                "seq": e.seq,
                "event_type": e.event_type,
                "entry_hash": e.entry_hash,
                "prev_hash": e.prev_hash,
                "created_at": e.created_at,
            }
            for e in entries
        ],
        "integrity": _integrity(db, evidence),
    }


def _parse_device_metadata(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except ValueError as exc:
        raise HTTPException(
            status_code=422, detail="device_metadata must be a JSON object"
        ) from exc
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=422, detail="device_metadata must be a JSON object")
    return parsed


# --- upload ------------------------------------------------------------------


@router.post("/cases/{case_ref}/evidence", response_model=EvidenceDetail, status_code=201)
def upload_evidence(
    case_ref: str,
    evidence_type: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    description: str | None = Form(None),
    occurred_at: str | None = Form(None),
    collected_at: str | None = Form(None),
    collection_lat: float | None = Form(None),
    collection_lon: float | None = Form(None),
    device_metadata: str | None = Form(None, description="JSON object, locked at upload"),
    requires_two_person: bool | None = Form(None),
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Log a file-backed evidence item.

    On upload the file is streamed to storage while being SHA-256 hashed, the
    collecting officer's signature is taken over that digest, any device
    metadata is locked and cross-checked, and one link is appended to the case
    hash chain committing to all of it.
    """
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="UPLOAD_EVIDENCE")
    try:
        evidence = evidence_service.log_evidence(
            db,
            case=case,
            collecting_officer=actor,
            evidence_type=evidence_type,
            title=title,
            description=description,
            file_stream=file.file,
            file_name=file.filename,
            content_type=file.content_type,
            occurred_at=occurred_at,
            collected_at=collected_at,
            collection_lat=collection_lat,
            collection_lon=collection_lon,
            device_metadata=_parse_device_metadata(device_metadata),
            two_person_override=requires_two_person,
        )
    except evidence_service.EvidenceError as exc:
        db.rollback()
        audit.record(
            db,
            actor=actor,
            action="UPLOAD_EVIDENCE",
            resource_type="EVIDENCE",
            case_id=case.id,
            outcome=audit.OUTCOME_REJECTED,
            detail=f"{exc.code}: {exc.message}",
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    audit.record(
        db,
        actor=actor,
        action="UPLOAD_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=case.id,
        detail=f"type={evidence.evidence_type} hash={evidence.content_hash[:16]}...",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _detail(db, evidence)


@router.post("/cases/{case_ref}/evidence/text", response_model=EvidenceDetail, status_code=201)
def upload_text_evidence(
    case_ref: str,
    payload: TextEvidenceCreate,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Log text-only evidence (witness statement, typed report) as JSON.

    The hash is taken over the exact UTF-8 bytes of ``text_content``, so the
    statement text itself is what the chain commits to.
    """
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="UPLOAD_EVIDENCE")
    try:
        evidence = evidence_service.log_evidence(
            db,
            case=case,
            collecting_officer=actor,
            evidence_type=payload.evidence_type,
            title=payload.title,
            description=payload.description,
            text_content=payload.text_content,
            occurred_at=payload.occurred_at,
            collected_at=payload.collected_at,
            collection_lat=payload.collection_lat,
            collection_lon=payload.collection_lon,
            device_metadata=payload.device_metadata.model_dump()
            if payload.device_metadata
            else None,
            two_person_override=payload.requires_two_person,
        )
    except evidence_service.EvidenceError as exc:
        db.rollback()
        audit.record(
            db,
            actor=actor,
            action="UPLOAD_EVIDENCE",
            resource_type="EVIDENCE",
            case_id=case.id,
            outcome=audit.OUTCOME_REJECTED,
            detail=f"{exc.code}: {exc.message}",
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    audit.record(
        db,
        actor=actor,
        action="UPLOAD_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=case.id,
        detail=f"type={evidence.evidence_type} hash={evidence.content_hash[:16]}...",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _detail(db, evidence)


# --- reads (all audited) -----------------------------------------------------


@router.get("/cases/{case_ref}/evidence", response_model=list[EvidenceOut])
def list_case_evidence(
    case_ref: str,
    status: str | None = None,
    evidence_type: str | None = None,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[Evidence]:
    """List a case's evidence.

    Parts 2-4 call this with ``status=CONFIRMED`` to get only what officers have
    actually verified -- that set is the verified case record.
    """
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="LIST_EVIDENCE")
    query = select(Evidence).where(Evidence.case_id == case.id)
    if status:
        query = query.where(Evidence.status == status.upper())
    if evidence_type:
        query = query.where(Evidence.evidence_type == evidence_type.upper())
    items = list(db.execute(query.order_by(Evidence.id)).scalars())
    audit.record(
        db,
        actor=actor,
        action="LIST_EVIDENCE",
        resource_type="EVIDENCE",
        case_id=case.id,
        detail=f"filter_status={status} returned={len(items)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return items


@router.get("/evidence/{evidence_ref}", response_model=EvidenceDetail)
def get_evidence(
    evidence_ref: str,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    evidence = get_evidence_or_404(
        db, evidence_ref=evidence_ref, actor=actor, ctx=ctx, action="VIEW_EVIDENCE"
    )
    audit.record(
        db,
        actor=actor,
        action="VIEW_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=evidence.case_id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _detail(db, evidence)


@router.get("/evidence/{evidence_ref}/file")
def download_evidence_file(
    evidence_ref: str,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> FileResponse:
    """Download the raw evidence bytes.

    Opening the actual file is the most sensitive read in the system, so it is
    audited *and* written into the case's hash chain, not just the audit log.
    """
    evidence = get_evidence_or_404(
        db, evidence_ref=evidence_ref, actor=actor, ctx=ctx, action="DOWNLOAD_EVIDENCE"
    )
    if not evidence.storage_path:
        audit.record(
            db,
            actor=actor,
            action="DOWNLOAD_EVIDENCE",
            resource_type="EVIDENCE",
            resource_id=evidence.uid,
            case_id=evidence.case_id,
            outcome=audit.OUTCOME_NOT_FOUND,
            detail="text-only evidence has no file",
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=404, detail="this evidence item has no stored file")

    audit.record(
        db,
        actor=actor,
        action="DOWNLOAD_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=evidence.case_id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    ledger.append_entry(
        db,
        case=evidence.case,
        event_type=ledger.EVENT_EVIDENCE_ACCESSED,
        payload={
            "evidence_uid": evidence.uid,
            "accessed_by": {"id": actor.id, "badge_number": actor.badge_number, "role": actor.role},
            "content_hash": evidence.content_hash,
        },
        actor_id=actor.id,
        evidence_id=evidence.id,
    )
    return FileResponse(
        evidence.storage_path,
        media_type=evidence.content_type or "application/octet-stream",
        filename=evidence.file_name or f"{evidence.uid}.bin",
    )


# --- two-person confirmation -------------------------------------------------


@router.post("/evidence/{evidence_ref}/confirm", response_model=EvidenceDetail)
def confirm_evidence(
    evidence_ref: str,
    payload: ConfirmRequest = ConfirmRequest(),
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Second-officer confirmation -- the other half of the two-person rule.

    The acting officer must be someone other than the one who logged the item.
    Their Ed25519 signature over the content hash is stored and both signatures
    are committed to the chain.
    """
    evidence = get_evidence_or_404(
        db, evidence_ref=evidence_ref, actor=actor, ctx=ctx, action="CONFIRM_EVIDENCE"
    )
    try:
        evidence = evidence_service.confirm_evidence(
            db, evidence=evidence, witnessing_officer=actor, note=payload.note
        )
    except evidence_service.EvidenceError as exc:
        db.rollback()
        audit.record(
            db,
            actor=actor,
            action="CONFIRM_EVIDENCE",
            resource_type="EVIDENCE",
            resource_id=evidence.uid,
            case_id=evidence.case_id,
            outcome=audit.OUTCOME_DENIED,
            detail=f"{exc.code}: {exc.message}",
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    audit.record(
        db,
        actor=actor,
        action="CONFIRM_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=evidence.case_id,
        detail="two-person confirmation complete",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _detail(db, evidence)


@router.post("/evidence/{evidence_ref}/reject", response_model=EvidenceDetail)
def reject_evidence(
    evidence_ref: str,
    payload: RejectRequest,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """A witnessing officer declines to attest. The item is never deleted."""
    evidence = get_evidence_or_404(
        db, evidence_ref=evidence_ref, actor=actor, ctx=ctx, action="REJECT_EVIDENCE"
    )
    try:
        evidence = evidence_service.reject_evidence(
            db, evidence=evidence, officer=actor, reason=payload.reason
        )
    except evidence_service.EvidenceError as exc:
        db.rollback()
        audit.record(
            db,
            actor=actor,
            action="REJECT_EVIDENCE",
            resource_type="EVIDENCE",
            resource_id=evidence.uid,
            case_id=evidence.case_id,
            outcome=audit.OUTCOME_DENIED,
            detail=f"{exc.code}: {exc.message}",
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    audit.record(
        db,
        actor=actor,
        action="REJECT_EVIDENCE",
        resource_type="EVIDENCE",
        resource_id=evidence.uid,
        case_id=evidence.case_id,
        detail=payload.reason,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _detail(db, evidence)


@router.get("/cases/{case_ref}/evidence/pending", response_model=list[EvidenceOut])
def list_pending_confirmations(
    case_ref: str,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[Evidence]:
    """Items still waiting for a second officer -- the confirmation queue."""
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="LIST_PENDING")
    items = list(
        db.execute(
            select(Evidence)
            .where(Evidence.case_id == case.id, Evidence.status != EVIDENCE_STATUS_CONFIRMED)
            .order_by(Evidence.id)
        ).scalars()
    )
    audit.record(
        db,
        actor=actor,
        action="LIST_PENDING",
        resource_type="EVIDENCE",
        case_id=case.id,
        detail=f"returned={len(items)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return items

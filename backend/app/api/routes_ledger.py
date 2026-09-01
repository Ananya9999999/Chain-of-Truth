"""Hash-chain reads, verification, and the append hook for Parts 2-4."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Evidence, LedgerEntry, User
from ..schemas import LedgerAppendRequest, LedgerEntryOut, VerifyReport
from ..services import audit, ledger
from .deps import RequestContext, db_session, get_case_or_404, get_current_user, request_context

router = APIRouter(tags=["ledger"])


def _entry_out(entry: LedgerEntry) -> dict:
    try:
        payload = json.loads(entry.payload)
    except ValueError:
        payload = entry.payload
    return {
        "seq": entry.seq,
        "event_type": entry.event_type,
        "actor_id": entry.actor_id,
        "evidence_id": entry.evidence_id,
        "payload": payload,
        "payload_hash": entry.payload_hash,
        "prev_hash": entry.prev_hash,
        "entry_hash": entry.entry_hash,
        "created_at": entry.created_at,
    }


@router.get("/cases/{case_ref}/ledger", response_model=list[LedgerEntryOut])
def get_ledger(
    case_ref: str,
    limit: int = 500,
    since_seq: int | None = None,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[dict]:
    """The case's chain, oldest first. ``since_seq`` supports live polling."""
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="VIEW_LEDGER")
    query = select(LedgerEntry).where(LedgerEntry.case_id == case.id)
    if since_seq is not None:
        query = query.where(LedgerEntry.seq > since_seq)
    entries = list(db.execute(query.order_by(LedgerEntry.seq).limit(limit)).scalars())
    audit.record(
        db,
        actor=actor,
        action="VIEW_LEDGER",
        resource_type="LEDGER",
        case_id=case.id,
        detail=f"returned={len(entries)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return [_entry_out(e) for e in entries]


@router.get("/cases/{case_ref}/ledger/verify", response_model=VerifyReport)
def verify_ledger(
    case_ref: str,
    check_files: bool = True,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Recompute the whole chain from genesis and re-hash every stored file.

    This is the endpoint to show a judge: it does not read a "verified" flag,
    it recomputes every digest and reports the exact sequence number where the
    chain first breaks.
    """
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="VERIFY_LEDGER")
    report = ledger.verify_case_chain(db, case, check_files=check_files)
    audit.record(
        db,
        actor=actor,
        action="VERIFY_LEDGER",
        resource_type="LEDGER",
        case_id=case.id,
        detail=f"valid={report['valid']} entries={report['entry_count']}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return report


@router.post("/cases/{case_ref}/ledger/append", response_model=LedgerEntryOut, status_code=201)
def append_to_ledger(
    case_ref: str,
    payload: LedgerAppendRequest,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Append a non-evidence event to the chain.

    INTEGRATION SEAM FOR PARTS 2-4: this is how an AI flag, an officer's
    confirm/dismiss, a guidance suggestion or a chargesheet QA run gets into the
    tamper-evident record. The event type must be one of the agreed values, the
    acting officer is recorded, and the entry is chained exactly like an
    evidence entry -- so "what the AI said and what the officer did about it"
    is as tamper-evident as the evidence itself.
    """
    if payload.event_type not in ledger.EXTERNAL_EVENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=(
                f"event_type must be one of {sorted(ledger.EXTERNAL_EVENT_TYPES)}; "
                "evidence lifecycle events are written by the evidence endpoints"
            ),
        )
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="APPEND_LEDGER")

    if payload.evidence_id is not None:
        evidence = db.get(Evidence, payload.evidence_id)
        if evidence is None or evidence.case_id != case.id:
            raise HTTPException(
                status_code=404, detail="evidence_id does not belong to this case"
            )

    entry = ledger.append_entry(
        db,
        case=case,
        event_type=payload.event_type,
        payload=payload.payload,
        actor_id=actor.id,
        evidence_id=payload.evidence_id,
    )
    audit.record(
        db,
        actor=actor,
        action="APPEND_LEDGER",
        resource_type="LEDGER",
        resource_id=str(entry.seq),
        case_id=case.id,
        detail=payload.event_type,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _entry_out(entry)

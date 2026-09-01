"""Audit trail reads. Reading the audit log is itself an audited access."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AuditLogEntry, User
from ..schemas import AuditEntryOut
from ..services import audit
from .deps import RequestContext, db_session, get_current_user, request_context

router = APIRouter(tags=["audit"])


@router.get("/audit", response_model=list[AuditEntryOut])
def list_audit(
    case_id: int | None = None,
    actor_id: int | None = None,
    resource_type: str | None = None,
    action: str | None = None,
    limit: int = 200,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[AuditLogEntry]:
    """Who looked at what, when -- including the reads, not just the edits."""
    query = select(AuditLogEntry)
    if case_id is not None:
        query = query.where(AuditLogEntry.case_id == case_id)
    if actor_id is not None:
        query = query.where(AuditLogEntry.actor_id == actor_id)
    if resource_type:
        query = query.where(AuditLogEntry.resource_type == resource_type.upper())
    if action:
        query = query.where(AuditLogEntry.action == action.upper())
    entries = list(
        db.execute(query.order_by(AuditLogEntry.seq.desc()).limit(limit)).scalars()
    )
    audit.record(
        db,
        actor=actor,
        action="VIEW_AUDIT_LOG",
        resource_type="AUDIT",
        case_id=case_id,
        detail=f"returned={len(entries)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return entries


@router.get("/audit/verify")
def verify_audit(
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Prove the access log itself has not been edited or thinned out.

    The audit trail is hash-chained too, so a deleted row shows up as a
    sequence gap and an edited row as a hash mismatch.
    """
    report = audit.verify_audit_chain(db)
    audit.record(
        db,
        actor=actor,
        action="VERIFY_AUDIT_LOG",
        resource_type="AUDIT",
        detail=f"valid={report['valid']} entries={report['entry_count']}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return report


@router.get("/audit/anchor")
def audit_anchor(
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Export the current audit head hash for external anchoring.

    Honest limitation, and the answer to it: a hash chain can detect edits and
    deletions in its middle, but not having its own tail chopped off -- only
    something outside the database can. Recording this head hash somewhere else
    on a schedule (a second system, a printed daily register, a public
    timestamping service) closes that last gap.
    """
    anchor = audit.head(db)
    audit.record(
        db,
        actor=actor,
        action="EXPORT_AUDIT_ANCHOR",
        resource_type="AUDIT",
        detail=f"head_seq={anchor['head_seq']}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return anchor

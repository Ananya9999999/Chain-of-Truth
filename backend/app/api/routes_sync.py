"""Offline-first sync endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..models import User
from ..schemas import SyncBatchRequest
from ..services import audit
from ..services import sync as sync_service
from .deps import RequestContext, db_session, get_current_user, request_context

router = APIRouter(tags=["offline-sync"])


@router.post("/sync/batch")
def sync_batch(
    payload: SyncBatchRequest,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Ingest evidence logged on a device with no connectivity.

    Idempotent per ``client_uuid``: re-sending a batch after a dropped
    connection returns the existing records instead of duplicating them. Each
    record's device-computed hash is re-verified against the bytes received, and
    the original collection/device timestamps are preserved on the record.
    """
    records = [r.model_dump() for r in payload.records]
    result = sync_service.sync_batch(
        db, records=records, syncing_officer=actor, device_id=payload.device_id
    )
    audit.record(
        db,
        actor=actor,
        action="OFFLINE_SYNC",
        resource_type="EVIDENCE",
        resource_id=payload.device_id,
        detail=(
            f"submitted={result['submitted']} created={result['counts']['created']} "
            f"duplicates={result['counts']['duplicate_ignored']} "
            f"rejected={result['counts']['rejected']}"
        ),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return result


@router.get("/sync/status")
def sync_status(
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    """Everything that arrived via offline sync, with its original timestamps."""
    summary = sync_service.pending_sync_summary(db)
    audit.record(
        db,
        actor=actor,
        action="VIEW_SYNC_STATUS",
        resource_type="EVIDENCE",
        detail=f"offline_items={summary['offline_logged_count']}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return summary

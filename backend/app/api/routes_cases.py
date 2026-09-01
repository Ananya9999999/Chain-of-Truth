"""Case creation and reads. Opening a case writes the genesis ledger link."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.canonical import utc_now_iso
from ..core.locks import write_lock
from ..models import Case, Evidence, User
from ..schemas import CaseCreate, CaseDetail, CaseOut
from ..services import audit, ledger
from .deps import RequestContext, db_session, get_case_or_404, get_current_user, request_context

router = APIRouter(tags=["cases"])


@router.post("/cases", response_model=CaseOut, status_code=201)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> Case:
    case = Case(
        case_number=payload.case_number,
        title=payload.title,
        description=payload.description,
        station=payload.station,
        opened_by_id=actor.id,
        created_at=utc_now_iso(),
    )
    with write_lock:
        db.add(case)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409, detail=f"case {payload.case_number} already exists"
            ) from exc
        db.refresh(case)

        # seq 0 -- the genesis link every later entry chains back to.
        ledger.append_entry(
            db,
            case=case,
            event_type=ledger.EVENT_CASE_OPENED,
            payload={
                "case_number": case.case_number,
                "title": case.title,
                "station": case.station,
                "opened_by": {"id": actor.id, "badge_number": actor.badge_number},
                "opened_at": case.created_at,
            },
            actor_id=actor.id,
        )
    audit.record(
        db,
        actor=actor,
        action="CASE_CREATED",
        resource_type="CASE",
        resource_id=case.id,
        case_id=case.id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return case


@router.get("/cases", response_model=list[CaseOut])
def list_cases(
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[Case]:
    cases = list(db.execute(select(Case).order_by(Case.id.desc())).scalars())
    audit.record(
        db,
        actor=actor,
        action="LIST_CASES",
        resource_type="CASE",
        detail=f"returned={len(cases)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return cases


@router.get("/cases/{case_ref}", response_model=CaseDetail)
def get_case(
    case_ref: str,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict:
    case = get_case_or_404(db, case_id=case_ref, actor=actor, ctx=ctx, action="VIEW_CASE")
    counts = dict(
        db.execute(
            select(Evidence.status, func.count(Evidence.id))
            .where(Evidence.case_id == case.id)
            .group_by(Evidence.status)
        ).all()
    )
    audit.record(
        db,
        actor=actor,
        action="VIEW_CASE",
        resource_type="CASE",
        resource_id=case.id,
        case_id=case.id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return {
        **{c.name: getattr(case, c.name) for c in case.__table__.columns},
        "ledger": ledger.chain_stats(db, case.id),
        "evidence_counts": counts,
    }

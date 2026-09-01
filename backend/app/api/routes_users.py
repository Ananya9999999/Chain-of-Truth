"""Officer registration and shift rosters."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.canonical import to_iso, utc_now_iso
from ..core.locks import write_lock
from ..core.signing import generate_keypair
from ..models import OfficerShift, User
from ..schemas import ShiftCreate, ShiftOut, UserCreate, UserOut
from ..services import audit
from .deps import RequestContext, db_session, get_current_user, request_context

router = APIRouter(tags=["officers"])


@router.post("/officers", response_model=UserOut, status_code=201)
def register_officer(payload: UserCreate, db: Session = Depends(db_session)) -> User:
    """Register an officer and issue their Ed25519 signing keypair.

    Open in the hackathon build so the demo can be seeded; Part 5 gates this
    behind a supervisor role.
    """
    private_key, public_key = generate_keypair()
    user = User(
        badge_number=payload.badge_number,
        full_name=payload.full_name,
        role=payload.role,
        station=payload.station,
        public_key=public_key,
        private_key=private_key,
        created_at=utc_now_iso(),
    )
    with write_lock:
        db.add(user)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"badge number {payload.badge_number} already registered",
            ) from exc
        db.refresh(user)
    audit.record(
        db,
        actor=user,
        action="OFFICER_REGISTERED",
        resource_type="USER",
        resource_id=user.id,
        detail=f"role={user.role}",
    )
    return user


@router.get("/officers", response_model=list[UserOut])
def list_officers(
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[User]:
    officers = list(db.execute(select(User).order_by(User.id)).scalars())
    audit.record(
        db,
        actor=actor,
        action="LIST_OFFICERS",
        resource_type="USER",
        detail=f"returned={len(officers)}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return officers


@router.post("/officers/{officer_id}/shifts", response_model=ShiftOut, status_code=201)
def log_shift(
    officer_id: int,
    payload: ShiftCreate,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> OfficerShift:
    """Log where an officer was rostered.

    This is what device metadata gets cross-checked against: a photo whose
    capture GPS sits far from the officer's logged shift location is flagged at
    upload rather than discovered in cross-examination.
    """
    officer = db.get(User, officer_id)
    if officer is None:
        raise HTTPException(status_code=404, detail="officer not found")
    try:
        started_at, ended_at = to_iso(payload.started_at), to_iso(payload.ended_at)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=422,
            detail="started_at and ended_at must be ISO-8601 timestamps",
        ) from exc
    if ended_at <= started_at:
        raise HTTPException(status_code=422, detail="shift must end after it starts")
    shift = OfficerShift(
        officer_id=officer_id,
        started_at=started_at,
        ended_at=ended_at,
        lat=payload.lat,
        lon=payload.lon,
        radius_m=payload.radius_m,
        location_label=payload.location_label,
        created_at=utc_now_iso(),
    )
    with write_lock:
        db.add(shift)
        db.commit()
        db.refresh(shift)
    audit.record(
        db,
        actor=actor,
        action="SHIFT_LOGGED",
        resource_type="SHIFT",
        resource_id=shift.id,
        detail=f"officer={officer_id} label={payload.location_label}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return shift


@router.get("/officers/{officer_id}/shifts", response_model=list[ShiftOut])
def list_shifts(
    officer_id: int,
    db: Session = Depends(db_session),
    actor: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> list[OfficerShift]:
    shifts = list(
        db.execute(
            select(OfficerShift)
            .where(OfficerShift.officer_id == officer_id)
            .order_by(OfficerShift.started_at)
        ).scalars()
    )
    audit.record(
        db,
        actor=actor,
        action="LIST_SHIFTS",
        resource_type="SHIFT",
        resource_id=str(officer_id),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return shifts

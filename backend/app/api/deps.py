"""Shared FastAPI dependencies.

Identity is resolved from an ``X-Officer-Id`` (or ``X-Badge-Number``) header.

INTEGRATION SEAM FOR PART 5: this is the single place identity enters the
system. Swapping the header for a real signed token, and adding permission-tier
checks on top of the resolved user, is a change to this file only -- every route
already receives a ``User`` and every access is already audited with that
user's id and role.
"""
from __future__ import annotations

from collections.abc import Iterator

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Case, Evidence, User
from ..services import audit


def db_session() -> Iterator[Session]:
    yield from get_db()


def get_current_user(
    x_officer_id: int | None = Header(default=None, alias="X-Officer-Id"),
    x_badge_number: str | None = Header(default=None, alias="X-Badge-Number"),
    db: Session = Depends(db_session),
) -> User:
    if x_officer_id is None and not x_badge_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="identify the acting officer with X-Officer-Id or X-Badge-Number",
        )
    if x_officer_id is not None:
        user = db.get(User, x_officer_id)
    else:
        user = db.execute(
            select(User).where(User.badge_number == x_badge_number)
        ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unknown officer")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="officer is not active")
    return user


class RequestContext:
    """Client details attached to every audit record."""

    def __init__(self, request: Request):
        client = request.client
        self.ip_address = client.host if client else None
        self.user_agent = request.headers.get("user-agent")


def request_context(request: Request) -> RequestContext:
    return RequestContext(request)


def get_case_or_404(
    db: Session, *, case_id: int | str, actor: User, ctx: RequestContext, action: str
) -> Case:
    """Fetch a case by id or case number, auditing a miss as well as a hit."""
    case = None
    if isinstance(case_id, int) or str(case_id).isdigit():
        case = db.get(Case, int(case_id))
    if case is None:
        case = db.execute(
            select(Case).where(Case.case_number == str(case_id))
        ).scalar_one_or_none()
    if case is None:
        audit.record(
            db,
            actor=actor,
            action=action,
            resource_type="CASE",
            resource_id=str(case_id),
            outcome=audit.OUTCOME_NOT_FOUND,
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=404, detail=f"case {case_id} not found")
    return case


def get_evidence_or_404(
    db: Session, *, evidence_ref: str, actor: User, ctx: RequestContext, action: str
) -> Evidence:
    """Fetch evidence by uid or numeric id, auditing a miss as well as a hit."""
    evidence = db.execute(
        select(Evidence).where(Evidence.uid == evidence_ref)
    ).scalar_one_or_none()
    if evidence is None and evidence_ref.isdigit():
        evidence = db.get(Evidence, int(evidence_ref))
    if evidence is None:
        audit.record(
            db,
            actor=actor,
            action=action,
            resource_type="EVIDENCE",
            resource_id=evidence_ref,
            outcome=audit.OUTCOME_NOT_FOUND,
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
        raise HTTPException(status_code=404, detail=f"evidence {evidence_ref} not found")
    return evidence

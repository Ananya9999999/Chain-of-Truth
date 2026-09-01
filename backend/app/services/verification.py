"""The human gate.

This is the only module allowed to move something out of the AI analysis layer
and into the verified case record. Every path through it:

  * writes an append-only VerificationDecision naming the officer and role,
  * snapshots what the AI originally said, before the human touched it,
  * writes an audit entry,
  * and never deletes the AI's original row -- a dismissal is a state, not an
    erasure.

That last point is what lets the defence see both the flag and the officer's
answer to it, which the spec treats as a transparency feature rather than a
liability.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.canonical import utc_now_iso
from ..models import Case, User
from ..models_analysis import (
    DECISION_CONFIRM,
    DECISION_DISMISS,
    DECISION_REQUEST_REVIEW,
    STATUS_DISMISSED,
    STATUS_HUMAN_CONFIRMED,
    STATUS_REQUIRES_REVIEW,
    STATUS_VERIFIED,
    Contradiction,
    ExtractedFact,
    TimelineEvent,
    VerificationDecision,
)
from ..models_features import AutopsyHypothesis, ChargesheetFinding, StatementDiff
from . import audit

VALID_DECISIONS = (DECISION_CONFIRM, DECISION_DISMISS, DECISION_REQUEST_REVIEW)

TARGET_FACT = "FACT"
TARGET_CONTRADICTION = "CONTRADICTION"
TARGET_TIMELINE = "TIMELINE_EVENT"
TARGET_HYPOTHESIS = "AUTOPSY_HYPOTHESIS"
TARGET_CHARGESHEET = "CHARGESHEET_FINDING"
TARGET_STATEMENT_DIFF = "STATEMENT_DIFF"

_MODEL_FOR_TARGET = {
    TARGET_FACT: ExtractedFact,
    TARGET_CONTRADICTION: Contradiction,
    TARGET_TIMELINE: TimelineEvent,
    TARGET_HYPOTHESIS: AutopsyHypothesis,
    TARGET_CHARGESHEET: ChargesheetFinding,
    TARGET_STATEMENT_DIFF: StatementDiff,
}

# Some decisions are reserved to a qualified role. An investigating officer must
# not be able to sign off a forensic-medical hypothesis.
_ROLE_REQUIRED = {
    TARGET_HYPOTHESIS: {"FORENSIC_REVIEWER", "SUPERVISOR"},
    TARGET_CHARGESHEET: {"LEGAL_REVIEWER", "SUPERVISOR"},
}


class VerificationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class DecisionOutcome:
    target_type: str
    target_uid: str | None
    previous_status: str
    new_status: str
    decision: str
    decided_by: str
    decided_at: str


def _status_field(target_type: str) -> str:
    return "verification_status" if target_type == TARGET_TIMELINE else "status"


def _snapshot(obj: Any) -> str:
    """Freeze the AI's own words at the moment a human overruled or accepted them."""
    fields = (
        "uid", "title", "value", "claim", "hypothesis", "severity",
        "confidence", "explanation", "reasoning", "status",
        "verification_status", "fact_type", "contradiction_type", "verdict",
    )
    data = {f: getattr(obj, f) for f in fields if hasattr(obj, f)}
    return json.dumps(data, default=str, sort_keys=True)


def decide(
    db: Session,
    *,
    case: Case,
    actor: User,
    target_type: str,
    target_ref: str,
    decision: str,
    reason: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> DecisionOutcome:
    """Record a human decision on one AI output and apply its consequence."""
    decision = (decision or "").upper().strip()
    if decision not in VALID_DECISIONS:
        raise VerificationError(
            f"decision must be one of {list(VALID_DECISIONS)}", status_code=422
        )

    model = _MODEL_FOR_TARGET.get(target_type)
    if model is None:
        raise VerificationError(
            f"unknown target_type '{target_type}'; expected one of "
            f"{sorted(_MODEL_FOR_TARGET)}",
            status_code=422,
        )

    required_roles = _ROLE_REQUIRED.get(target_type)
    if required_roles and actor.role not in required_roles:
        audit.record(
            db,
            actor=actor,
            action="VERIFICATION_DENIED",
            resource_type=target_type,
            resource_id=str(target_ref),
            case_id=case.id,
            outcome=audit.OUTCOME_DENIED,
            detail=f"role {actor.role} may not decide {target_type}",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise VerificationError(
            f"role '{actor.role}' may not decide a {target_type}; "
            f"requires one of {sorted(required_roles)}",
            status_code=403,
        )

    obj = db.execute(select(model).where(model.uid == str(target_ref))).scalar_one_or_none()
    if obj is None and str(target_ref).isdigit():
        obj = db.get(model, int(target_ref))
    if obj is None:
        raise VerificationError(f"{target_type} '{target_ref}' not found", status_code=404)
    if getattr(obj, "case_id", None) != case.id:
        # Case isolation is a security property, not a convenience.
        raise VerificationError(
            f"{target_type} '{target_ref}' does not belong to case "
            f"{case.case_number}",
            status_code=404,
        )

    field = _status_field(target_type)
    previous = getattr(obj, field, "UNKNOWN")
    snapshot = _snapshot(obj)

    if decision == DECISION_CONFIRM:
        new_status = STATUS_VERIFIED if target_type == TARGET_TIMELINE else STATUS_HUMAN_CONFIRMED
    elif decision == DECISION_DISMISS:
        new_status = STATUS_DISMISSED
    else:
        new_status = STATUS_REQUIRES_REVIEW

    setattr(obj, field, new_status)
    now = utc_now_iso()

    if hasattr(obj, "resolved_by_id"):
        obj.resolved_by_id = actor.id
        obj.resolved_at = now
        if reason and hasattr(obj, "resolution_note"):
            obj.resolution_note = reason
    if hasattr(obj, "reviewed_by_id"):
        obj.reviewed_by_id = actor.id
        obj.reviewed_at = now
        if reason and hasattr(obj, "review_note"):
            obj.review_note = reason

    db.add(
        VerificationDecision(
            case_id=case.id,
            target_type=target_type,
            target_id=obj.id,
            target_uid=getattr(obj, "uid", None),
            decision=decision,
            reason=reason,
            decided_by_id=actor.id,
            decided_by_role=actor.role,
            decided_at=now,
            ai_state_snapshot=snapshot,
        )
    )

    # Confirming an extracted fact promotes its timeline candidate too, so the
    # shared timeline actually reflects the officer's decision.
    if decision == DECISION_CONFIRM and target_type == TARGET_FACT:
        for event in db.execute(
            select(TimelineEvent).where(TimelineEvent.source_fact_id == obj.id)
        ).scalars():
            event.verification_status = STATUS_VERIFIED

    audit.record(
        db,
        actor=actor,
        action=f"VERIFICATION_{decision}",
        resource_type=target_type,
        resource_id=str(getattr(obj, "uid", obj.id)),
        case_id=case.id,
        detail=json.dumps(
            {"from": previous, "to": new_status, "reason": reason}, default=str
        ),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.flush()

    return DecisionOutcome(
        target_type=target_type,
        target_uid=getattr(obj, "uid", None),
        previous_status=previous,
        new_status=new_status,
        decision=decision,
        decided_by=actor.badge_number,
        decided_at=now,
    )


def review_queue(db: Session, *, case_id: int) -> list[dict[str, Any]]:
    """Everything currently awaiting a human decision, newest first."""
    queue: list[dict[str, Any]] = []

    for c in db.execute(
        select(Contradiction).where(
            Contradiction.case_id == case_id,
            Contradiction.status == STATUS_REQUIRES_REVIEW,
        )
    ).scalars():
        queue.append(
            {
                "target_type": TARGET_CONTRADICTION,
                "uid": c.uid,
                "title": c.title,
                "summary": c.description,
                "severity": c.severity,
                "confidence": c.confidence,
                "explanation": c.explanation,
                "status": c.status,
                "created_at": c.created_at,
            }
        )

    for h in db.execute(
        select(AutopsyHypothesis).where(
            AutopsyHypothesis.case_id == case_id,
            AutopsyHypothesis.status == "AI_HYPOTHESIS",
        )
    ).scalars():
        queue.append(
            {
                "target_type": TARGET_HYPOTHESIS,
                "uid": h.uid,
                "title": h.title,
                "summary": h.hypothesis,
                "severity": "REVIEW",
                "confidence": h.confidence,
                "explanation": h.reasoning,
                "status": h.status,
                "disclaimer": h.disclaimer,
                "requires_role": sorted(_ROLE_REQUIRED[TARGET_HYPOTHESIS]),
                "created_at": h.created_at,
            }
        )

    for d in db.execute(
        select(StatementDiff).where(
            StatementDiff.case_id == case_id,
            StatementDiff.status == STATUS_REQUIRES_REVIEW,
        )
    ).scalars():
        queue.append(
            {
                "target_type": TARGET_STATEMENT_DIFF,
                "uid": d.uid,
                "title": f"Statement changed: {d.change_type}",
                "summary": d.explanation,
                "severity": d.significance,
                "confidence": d.confidence,
                "explanation": d.explanation,
                "status": d.status,
                "created_at": d.created_at,
            }
        )

    queue.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    return queue


def history_for(db: Session, *, case_id: int, limit: int = 200) -> list[dict[str, Any]]:
    """Every decision taken on this case -- the due-diligence log."""
    rows = db.execute(
        select(VerificationDecision)
        .where(VerificationDecision.case_id == case_id)
        .order_by(VerificationDecision.decided_at.desc())
        .limit(limit)
    ).scalars()
    return [
        {
            "target_type": r.target_type,
            "target_uid": r.target_uid,
            "decision": r.decision,
            "reason": r.reason,
            "decided_by_id": r.decided_by_id,
            "decided_by_role": r.decided_by_role,
            "decided_at": r.decided_at,
            "ai_state_snapshot": json.loads(r.ai_state_snapshot)
            if r.ai_state_snapshot
            else None,
        }
        for r in rows
    ]

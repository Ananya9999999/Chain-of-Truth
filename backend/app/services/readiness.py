"""Case Closure Readiness Score.

A transparent weighted score over things the system can actually count:
unresolved contradictions, unverified AI output, open evidence gaps, ledger
integrity, and two-person compliance.

It is NOT a legal judgement about guilt, strength of case, or whether to file.
It answers one narrow question -- "how much unresolved analytical work is
outstanding?" -- and it always shows its arithmetic, because a number a judge
cannot interrogate is a number they should not trust.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Evidence
from ..models_analysis import (
    STATUS_AI_UNVERIFIED,
    STATUS_DISMISSED,
    STATUS_REQUIRES_REVIEW,
    Contradiction,
    ExtractedFact,
    TimelineEvent,
)
from ..models_features import EvidenceGap

DISCLAIMER = (
    "Operational readiness indicator only. Measures unresolved analytical work "
    "in this system - not guilt, innocence, evidentiary strength, or whether a "
    "case should be filed. A human legal reviewer decides that."
)

# Weights sum to 1.0. Kept explicit so the UI can render the same breakdown.
_WEIGHTS = {
    "contradictions_resolved": 0.30,
    "ai_output_reviewed": 0.25,
    "gaps_closed": 0.20,
    "evidence_confirmed": 0.15,
    "ledger_intact": 0.10,
}


def _ratio(done: int, total: int) -> float:
    """Nothing to do counts as complete, not as zero."""
    if total <= 0:
        return 1.0
    return max(0.0, min(1.0, done / total))


def compute(db: Session, *, case_id: int, ledger_intact: bool = True) -> dict[str, Any]:
    """Return the score plus the full factor breakdown."""

    def count(model, *conditions) -> int:
        stmt = select(func.count()).select_from(model).where(model.case_id == case_id)
        for cond in conditions:
            stmt = stmt.where(cond)
        return int(db.execute(stmt).scalar_one())

    total_contra = count(Contradiction)
    open_contra = count(Contradiction, Contradiction.status == STATUS_REQUIRES_REVIEW)
    resolved_contra = total_contra - open_contra

    total_facts = count(ExtractedFact)
    unreviewed_facts = count(ExtractedFact, ExtractedFact.status == STATUS_AI_UNVERIFIED)
    reviewed_facts = total_facts - unreviewed_facts

    total_gaps = count(EvidenceGap)
    open_gaps = count(EvidenceGap, EvidenceGap.status == "OPEN")
    closed_gaps = total_gaps - open_gaps

    total_ev = count(Evidence)
    confirmed_ev = count(Evidence, Evidence.status == "CONFIRMED")

    factors = [
        {
            "key": "contradictions_resolved",
            "label": "Contradictions resolved",
            "weight": _WEIGHTS["contradictions_resolved"],
            "value": _ratio(resolved_contra, total_contra),
            "detail": f"{resolved_contra} of {total_contra} flags answered by an officer",
            "outstanding": open_contra,
            "blocking": open_contra > 0,
        },
        {
            "key": "ai_output_reviewed",
            "label": "AI output reviewed",
            "weight": _WEIGHTS["ai_output_reviewed"],
            "value": _ratio(reviewed_facts, total_facts),
            "detail": f"{reviewed_facts} of {total_facts} extracted facts verified or dismissed",
            "outstanding": unreviewed_facts,
            "blocking": False,
        },
        {
            "key": "gaps_closed",
            "label": "Evidence gaps closed",
            "weight": _WEIGHTS["gaps_closed"],
            "value": _ratio(closed_gaps, total_gaps),
            "detail": f"{closed_gaps} of {total_gaps} identified gaps closed",
            "outstanding": open_gaps,
            "blocking": open_gaps > 0,
        },
        {
            "key": "evidence_confirmed",
            "label": "Evidence confirmed",
            "weight": _WEIGHTS["evidence_confirmed"],
            "value": _ratio(confirmed_ev, total_ev),
            "detail": f"{confirmed_ev} of {total_ev} items past two-person confirmation",
            "outstanding": total_ev - confirmed_ev,
            "blocking": False,
        },
        {
            "key": "ledger_intact",
            "label": "Hash chain intact",
            "weight": _WEIGHTS["ledger_intact"],
            "value": 1.0 if ledger_intact else 0.0,
            "detail": "Chain verified" if ledger_intact else "CHAIN BROKEN - integrity failure",
            "outstanding": 0 if ledger_intact else 1,
            "blocking": not ledger_intact,
        },
    ]

    score = sum(f["value"] * f["weight"] for f in factors)
    blockers = [f["label"] for f in factors if f["blocking"]]

    if not ledger_intact:
        band = "INTEGRITY FAILURE"
    elif score >= 0.85 and not blockers:
        band = "READY FOR REVIEW"
    elif score >= 0.6:
        band = "IN PROGRESS"
    else:
        band = "EARLY STAGE"

    total_timeline = count(TimelineEvent)
    verified_timeline = count(TimelineEvent, TimelineEvent.verification_status == "VERIFIED")

    return {
        "score": round(score, 4),
        "percent": round(score * 100, 1),
        "band": band,
        "factors": factors,
        "blockers": blockers,
        "counts": {
            "evidence_total": total_ev,
            "evidence_confirmed": confirmed_ev,
            "contradictions_total": total_contra,
            "contradictions_open": open_contra,
            "contradictions_dismissed": count(
                Contradiction, Contradiction.status == STATUS_DISMISSED
            ),
            "facts_total": total_facts,
            "facts_unreviewed": unreviewed_facts,
            "gaps_open": open_gaps,
            "timeline_total": total_timeline,
            "timeline_verified": verified_timeline,
        },
        "disclaimer": DISCLAIMER,
        "method": "transparent_weighted_v1",
    }

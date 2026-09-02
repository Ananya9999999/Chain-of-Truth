"""Part 3 — Investigation Guidance, Autopsy, and Chargesheet QA agents.

Every AI output is labeled unverified / hypothesis and requires human review.
These routes never write AI conclusions into the verified case record.

Mounted from app.main under the /api/v1 prefix.
"""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..api.deps import db_session, get_current_user, request_context, RequestContext
from ..models import Case, Evidence, User
from ..services import audit
from ..services.ai_engine import (
    LEGAL_KB,
    run_full_analysis,
    run_autopsy_agent,
    run_chargesheet_agent,
    generate_guidance,
    detect_contradictions,
    build_timeline_candidates,
)

router = APIRouter(prefix="/cases", tags=["agents-part3"])


def _evidence_dicts(db: Session, case_id: int) -> list[dict]:
    rows = db.execute(select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id)).scalars().all()
    out = []
    for e in rows:
        # Map Part 1 Evidence fields flexibly
        raw = getattr(e, "raw_content", None) or getattr(e, "text_content", None) or getattr(e, "description", None) or ""
        title = getattr(e, "title", None) or getattr(e, "label", None) or f"Evidence #{e.id}"
        etype = getattr(e, "evidence_type", None) or getattr(e, "kind", None) or "unknown"
        collected = getattr(e, "collected_at", None) or getattr(e, "captured_at", None) or getattr(e, "created_at", None)
        out.append({
            "id": e.id,
            "evidence_type": etype,
            "title": title,
            "description": getattr(e, "description", None) or "",
            "raw_content": raw if isinstance(raw, str) else str(raw or ""),
            "file_hash": getattr(e, "content_hash", None) or getattr(e, "file_hash", None),
            "chain_hash": getattr(e, "chain_hash", None) or getattr(e, "entry_hash", None),
            "collected_at": collected if isinstance(collected, str) else (collected.isoformat() if collected else None),
            "is_verified": getattr(e, "status", "") in ("CONFIRMED", "verified", "VERIFIED"),
        })
    return out


def _get_case(db: Session, case_id: int) -> Case:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case not found")
    return case


class ChargesheetQABody(BaseModel):
    chargesheet_text: Optional[str] = Field(default=None, description="Optional draft chargesheet text to scan")


@router.get("/{case_id}/guidance")
def case_guidance(
    case_id: int,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Investigation Guidance Agent — checklist assistant, not legal authority."""
    case = _get_case(db, case_id)
    evidence = _evidence_dicts(db, case_id)
    analysis = run_full_analysis({"title": case.title, "id": case.id}, evidence)

    audit.record(
        db,
        actor=user,
        action="VIEW_GUIDANCE",
        resource_type="case",
        resource_id=case_id,
        case_id=case_id,
        detail=f"agent=guidance items={len(analysis['guidance'])}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()

    return {
        "case_id": case_id,
        "label": "AI-generated checklist — requires officer review; not legal authority",
        "guidance": analysis["guidance"],
        "disclaimer": analysis["disclaimer"],
    }


@router.get("/{case_id}/autopsy-analysis")
def autopsy_analysis(
    case_id: int,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """
    Autopsy / Post-Mortem Analysis Agent.
    Every output is an investigative hypothesis requiring forensic medical officer review.
    This agent never diagnoses cause of death.
    """
    case = _get_case(db, case_id)
    evidence = _evidence_dicts(db, case_id)
    timeline = build_timeline_candidates(evidence)
    result = run_autopsy_agent({"title": case.title, "id": case.id}, evidence, timeline)

    audit.record(
        db,
        actor=user,
        action="VIEW_AUTOPSY_ANALYSIS",
        resource_type="case",
        resource_id=case_id,
        case_id=case_id,
        detail=f"agent=autopsy status={result.get('status')}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()

    return {"case_id": case_id, **result}


@router.post("/{case_id}/chargesheet-qa")
def chargesheet_qa(
    case_id: int,
    body: ChargesheetQABody | None = None,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """
    Chargesheet Consistency Check — pre-filing QA checklist for a human legal reviewer.
    Not a verdict on case strength.
    """
    case = _get_case(db, case_id)
    evidence = _evidence_dicts(db, case_id)
    timeline = build_timeline_candidates(evidence)
    contradictions = detect_contradictions(evidence, timeline)
    cs_text = body.chargesheet_text if body else None
    result = run_chargesheet_agent(
        {"title": case.title, "id": case.id},
        evidence,
        timeline,
        contradictions,
        cs_text,
    )

    audit.record(
        db,
        actor=user,
        action="RUN_CHARGESHEET_QA",
        resource_type="case",
        resource_id=case_id,
        case_id=case_id,
        detail=f"agent=chargesheet_qa risk={result.get('overall_risk_level')}",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()

    return {"case_id": case_id, **result}


@router.get("/{case_id}/analysis")
def full_analysis(
    case_id: int,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """One-shot: timeline candidates + contradictions + guidance (all unverified)."""
    case = _get_case(db, case_id)
    evidence = _evidence_dicts(db, case_id)
    analysis = run_full_analysis({"title": case.title, "id": case.id}, evidence)

    audit.record(
        db,
        actor=user,
        action="RUN_FULL_ANALYSIS",
        resource_type="case",
        resource_id=case_id,
        case_id=case_id,
        detail="agent=full_analysis",
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()

    return {
        "case_id": case_id,
        "label": "AI working analysis — unverified until officer confirms",
        **analysis,
    }


# legal-kb is registered directly on the app in main.py
def legal_kb_payload() -> dict[str, Any]:
    return {
        "count": len(LEGAL_KB),
        "disclaimer": "Curated knowledge base. Guidance reasons only from these entries.",
        "entries": [
            {
                "id": e["id"],
                "section": e["section"],
                "title": e["title"],
                "category": e["category"],
                "triggers": e["triggers"],
            }
            for e in LEGAL_KB
        ],
    }

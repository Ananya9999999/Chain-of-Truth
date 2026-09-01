"""AI analysis layer HTTP surface.

Read routes audit the access (the spec requires auditing views, not just edits);
write routes go through services/verification.py so no route can bypass the
human gate.

Every response that carries AI output also carries the provider badge, so a
client physically cannot render a finding without knowing whether a language
model or a deterministic rule produced it.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai.registry import get_provider
from ..models import Evidence, User
from ..models_analysis import (
    Contradiction,
    ContradictionSource,
    ExtractedFact,
    GraphEdge,
    GraphNode,
    ProcessingJob,
    TimelineEvent,
)
from ..models_features import EvidenceGap, GuidanceItem
from ..rag import store as rag_store
from ..services import analysis, audit, ledger, readiness, verification
from .deps import (
    RequestContext,
    db_session,
    get_case_or_404,
    get_current_user,
    request_context,
)

router = APIRouter(tags=["analysis"])


def _provider_badge() -> dict[str, Any]:
    """Never let a client show AI output without knowing what produced it."""
    return get_provider().describe()


# --- pipeline ----------------------------------------------------------------
@router.post("/cases/{case_ref}/evidence/{evidence_ref}/analyze")
def analyze(
    case_ref: str,
    evidence_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Run extraction, comparison, timeline, graph and guidance for one item."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="AI_ANALYSIS_RUN"
    )
    evidence = db.execute(
        select(Evidence).where(Evidence.uid == evidence_ref)
    ).scalar_one_or_none()
    if evidence is None and evidence_ref.isdigit():
        evidence = db.get(Evidence, int(evidence_ref))
    if evidence is None or evidence.case_id != case.id:
        raise HTTPException(404, f"evidence {evidence_ref} not found in this case")

    job = analysis.analyze_evidence(db, case=case, evidence=evidence, actor=user)
    db.commit()

    return {
        "job": {
            "uid": job.uid,
            "status": job.status,
            "stage": job.stage,
            "progress": job.progress,
            "provider": job.provider,
            "model": job.model,
            "error": job.error,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
        },
        "ai_provider": _provider_badge(),
        "retrieval": rag_store.describe(db),
    }


@router.get("/jobs/{job_uid}")
def job_status(
    job_uid: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    job = db.execute(
        select(ProcessingJob).where(ProcessingJob.uid == job_uid)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "job not found")
    return {
        "uid": job.uid,
        "status": job.status,
        "stage": job.stage,
        "progress": job.progress,
        "provider": job.provider,
        "model": job.model,
        "error": job.error,
    }


# --- AI analysis layer (unverified) -----------------------------------------
@router.get("/cases/{case_ref}/facts")
def list_facts(
    case_ref: str,
    status: str | None = Query(None),
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Extracted facts, each with the exact source text it came from."""
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="FACTS_VIEW")
    stmt = select(ExtractedFact).where(ExtractedFact.case_id == case.id)
    if status:
        stmt = stmt.where(ExtractedFact.status == status.upper())

    facts = [
        {
            "uid": f.uid,
            "evidence_id": f.evidence_id,
            "fact_type": f.fact_type,
            "value": f.value,
            "source_excerpt": f.source_excerpt,
            "source_offset_start": f.source_offset_start,
            "source_offset_end": f.source_offset_end,
            "confidence": f.confidence,
            "explanation": f.explanation,
            "status": f.status,
            "language": f.language,
            "created_at": f.created_at,
        }
        for f in db.execute(stmt).scalars()
    ]
    audit.record(
        db, actor=user, action="FACTS_VIEW", resource_type="CASE",
        resource_id=case.case_number, case_id=case.id,
        detail=f"{len(facts)} facts", ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()
    return {"facts": facts, "count": len(facts), "ai_provider": _provider_badge()}


@router.get("/cases/{case_ref}/contradictions")
def list_contradictions(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Contradictions with both conflicting excerpts attached."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="CONTRADICTION_VIEW"
    )
    out = []
    for c in db.execute(
        select(Contradiction).where(Contradiction.case_id == case.id)
    ).scalars():
        sources = db.execute(
            select(ContradictionSource).where(
                ContradictionSource.contradiction_id == c.id
            )
        ).scalars()
        out.append(
            {
                "uid": c.uid,
                "title": c.title,
                "description": c.description,
                "contradiction_type": c.contradiction_type,
                "severity": c.severity,
                "confidence": c.confidence,
                "explanation": c.explanation,
                "status": c.status,
                "resolved_by_id": c.resolved_by_id,
                "resolved_at": c.resolved_at,
                "resolution_note": c.resolution_note,
                "created_at": c.created_at,
                "sources": [
                    {
                        "side": s.side,
                        "evidence_id": s.evidence_id,
                        "excerpt": s.excerpt,
                        "claimed_value": s.claimed_value,
                        "claimed_at": s.claimed_at,
                    }
                    for s in sources
                ],
            }
        )
    audit.record(
        db, actor=user, action="CONTRADICTION_VIEW", resource_type="CASE",
        resource_id=case.case_number, case_id=case.id,
        detail=f"{len(out)} contradictions", ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()
    return {"contradictions": out, "count": len(out), "ai_provider": _provider_badge()}


# --- verified layer ----------------------------------------------------------
@router.get("/cases/{case_ref}/timeline")
def get_timeline(
    case_ref: str,
    status: str | None = Query(None, description="Filter by verification status"),
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """The shared case timeline, ordered by when events happened."""
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="TIMELINE_VIEW")
    stmt = select(TimelineEvent).where(TimelineEvent.case_id == case.id)
    if status:
        stmt = stmt.where(TimelineEvent.verification_status == status.upper())

    events = sorted(
        db.execute(stmt).scalars(),
        key=lambda e: (e.occurred_at or e.recorded_at or ""),
    )
    payload = [
        {
            "uid": e.uid,
            "title": e.title,
            "description": e.description,
            "event_type": e.event_type,
            "occurred_at": e.occurred_at,
            "occurred_at_precision": e.occurred_at_precision,
            "recorded_at": e.recorded_at,
            "evidence_id": e.evidence_id,
            "verification_status": e.verification_status,
            "confidence": e.confidence,
            "lat": e.lat,
            "lon": e.lon,
        }
        for e in events
    ]
    audit.record(
        db, actor=user, action="TIMELINE_VIEW", resource_type="CASE",
        resource_id=case.case_number, case_id=case.id,
        detail=f"{len(payload)} events", ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    db.commit()
    verified = sum(1 for e in payload if e["verification_status"] == "VERIFIED")
    return {
        "events": payload,
        "count": len(payload),
        "verified_count": verified,
        "unverified_count": len(payload) - verified,
    }


# --- the human gate ----------------------------------------------------------
@router.post("/cases/{case_ref}/verify/{target_type}/{target_ref}")
def verify(
    case_ref: str,
    target_type: str,
    target_ref: str,
    payload: dict = Body(
        ...,
        openapi_examples={
            "confirm": {"value": {"decision": "CONFIRM", "reason": "Cross-checked against CCTV"}},
            "dismiss": {"value": {"decision": "DISMISS", "reason": "Witness was estimating"}},
            "review": {"value": {"decision": "REQUEST_REVIEW", "reason": "Needs forensic input"}},
        },
    ),
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Confirm / dismiss / request review. The only path into the verified record."""
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="VERIFICATION")
    try:
        outcome = verification.decide(
            db,
            case=case,
            actor=user,
            target_type=target_type.upper(),
            target_ref=target_ref,
            decision=str(payload.get("decision", "")),
            reason=payload.get("reason"),
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
    except verification.VerificationError as exc:
        db.commit()  # keep the denial audit entry
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    db.commit()
    return {
        "target_type": outcome.target_type,
        "target_uid": outcome.target_uid,
        "previous_status": outcome.previous_status,
        "new_status": outcome.new_status,
        "decision": outcome.decision,
        "decided_by": outcome.decided_by,
        "decided_at": outcome.decided_at,
        "note": "AI output preserved; decision recorded permanently in the audit trail.",
    }


@router.get("/cases/{case_ref}/review-queue")
def review_queue(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="REVIEW_QUEUE_VIEW")
    items = verification.review_queue(db, case_id=case.id)
    db.commit()
    return {"items": items, "count": len(items), "ai_provider": _provider_badge()}


@router.get("/cases/{case_ref}/verification-history")
def verification_history(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """The due-diligence log: every AI flag and how a human answered it."""
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="VERIFICATION_HISTORY_VIEW")
    history = verification.history_for(db, case_id=case.id)
    db.commit()
    return {"history": history, "count": len(history)}


# --- graph -------------------------------------------------------------------
@router.get("/cases/{case_ref}/graph")
def get_graph(
    case_ref: str,
    node_types: str | None = Query(None, description="Comma-separated filter"),
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="GRAPH_VIEW")
    wanted = {t.strip() for t in node_types.split(",")} if node_types else None

    nodes = []
    for n in db.execute(select(GraphNode).where(GraphNode.case_id == case.id)).scalars():
        if wanted and n.node_type not in wanted:
            continue
        nodes.append(
            {
                "id": n.id,
                "key": n.node_key,
                "type": n.node_type,
                "subtype": n.subtype,
                "label": n.label,
                "evidence_id": n.evidence_id,
                "verification_status": n.verification_status,
                "attributes": json.loads(n.attributes) if n.attributes else None,
            }
        )
    ids = {n["id"] for n in nodes}
    edges = [
        {
            "id": e.id,
            "source": e.source_id,
            "target": e.target_id,
            "type": e.edge_type,
            "weight": e.weight,
            "evidence_id": e.evidence_id,
            "verification_status": e.verification_status,
            "explanation": e.explanation,
        }
        for e in db.execute(select(GraphEdge).where(GraphEdge.case_id == case.id)).scalars()
        if e.source_id in ids and e.target_id in ids
    ]
    audit.record(
        db, actor=user, action="GRAPH_VIEW", resource_type="CASE",
        resource_id=case.case_number, case_id=case.id,
        detail=f"{len(nodes)} nodes / {len(edges)} edges",
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )
    db.commit()
    return {"nodes": nodes, "edges": edges}


# --- guidance, gaps, readiness ----------------------------------------------
@router.get("/cases/{case_ref}/guidance-items")
def guidance_items(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="GUIDANCE_VIEW")
    items = [
        {
            "uid": g.uid,
            "title": g.title,
            "recommendation": g.recommendation,
            "rationale": g.rationale,
            "category": g.category,
            "priority": g.priority,
            "legal_ref": g.legal_ref,
            "legal_title": g.legal_title,
            "legal_text": g.legal_text,
            "confidence": g.confidence,
            "status": g.status,
        }
        for g in db.execute(
            select(GuidanceItem).where(GuidanceItem.case_id == case.id)
        ).scalars()
    ]
    db.commit()
    return {
        "items": items,
        "count": len(items),
        "framing": (
            "AI-assisted procedural checklist. Not legal authority. Does not "
            "replace review by a public prosecutor or legal officer. Every "
            "citation links to the curated rule it came from."
        ),
        "ai_provider": _provider_badge(),
    }


@router.get("/cases/{case_ref}/gaps")
def evidence_gaps(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="GAPS_VIEW")
    gaps = [
        {
            "uid": g.uid,
            "title": g.title,
            "description": g.description,
            "gap_type": g.gap_type,
            "severity": g.severity,
            "suggested_action": g.suggested_action,
            "legal_ref": g.legal_ref,
            "status": g.status,
        }
        for g in db.execute(
            select(EvidenceGap).where(EvidenceGap.case_id == case.id)
        ).scalars()
    ]
    db.commit()
    return {"gaps": gaps, "count": len(gaps)}


@router.get("/cases/{case_ref}/readiness")
def case_readiness(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Closure readiness with the full factor breakdown."""
    case = get_case_or_404(db, case_id=case_ref, actor=user, ctx=ctx, action="READINESS_VIEW")
    report = ledger.verify_case_chain(db, case, check_files=False)
    # verify_case_chain returns a dict; treat any falsy/absent verdict as intact
    # only when the key genuinely is not reported, never by swallowing an error.
    intact = bool(report.get("valid", report.get("is_valid", True)))
    result = readiness.compute(db, case_id=case.id, ledger_intact=intact)
    db.commit()
    return result

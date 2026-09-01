"""Additional feature endpoints: similarity, statements, correlation,
location scoring and autopsy cross-check.

Kept separate from routes_analysis so the core pipeline (extract -> compare ->
verify) stays readable on its own. Every route here audits the read, and every
response carries the framing the specification requires -- similarity is not
proof, a changed statement is not a finding of dishonesty, location scores are
heuristics, and autopsy output is a hypothesis awaiting a qualified reviewer.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import User
from ..models_analysis import Person
from ..models_features import (
    AutopsyFinding,
    AutopsyHypothesis,
    AutopsyReport,
    CorrelationFinding,
    LocationPoint,
    LocationScore,
    PhoneRecord,
    SimilarityMatch,
    StatementDiff,
    StatementVersion,
)
from .deps import (
    RequestContext,
    db_session,
    get_case_or_404,
    get_current_user,
    request_context,
)

router = APIRouter(tags=["features"])


@router.get("/cases/{case_ref}/similarity")
def case_similarity(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Method/MO overlap with other cases. Similarity is not proof."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="SIMILARITY_VIEW"
    )
    matches = [
        {
            "uid": m.uid,
            "matched_case_number": m.matched_case_number,
            "matched_case_title": m.matched_case_title,
            "similarity_score": m.similarity_score,
            "matched_features": json.loads(m.matched_features or "[]"),
            "explanation": m.explanation,
            "method": m.method,
            "status": m.status,
        }
        for m in db.execute(
            select(SimilarityMatch).where(SimilarityMatch.case_id == case.id)
        ).scalars()
    ]
    db.commit()
    return {
        "matches": matches,
        "count": len(matches),
        "caveat": (
            "Similarity indicates a pattern worth checking. It is not evidence that "
            "the same person is responsible and must never be presented as such."
        ),
    }


@router.get("/cases/{case_ref}/statements")
def statement_reliability(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Version-to-version changes in witness statements."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="STATEMENT_VIEW"
    )

    versions = list(
        db.execute(
            select(StatementVersion).where(StatementVersion.case_id == case.id)
        ).scalars()
    )
    persons = {
        p.id: p
        for p in db.execute(select(Person).where(Person.case_id == case.id)).scalars()
    }
    by_version = {v.id: v for v in versions}

    diffs = []
    for d in db.execute(
        select(StatementDiff).where(StatementDiff.case_id == case.id)
    ).scalars():
        person = persons.get(d.person_id)
        diffs.append(
            {
                "uid": d.uid,
                "person_name": person.full_name if person else "Unknown",
                "person_type": person.person_type if person else None,
                "change_type": d.change_type,
                "field": d.field,
                "before_text": d.before_text,
                "after_text": d.after_text,
                "significance": d.significance,
                "explanation": d.explanation,
                "confidence": d.confidence,
                "status": d.status,
                "from_recorded_at": (
                    by_version[d.from_version_id].recorded_at
                    if d.from_version_id in by_version
                    else None
                ),
                "to_recorded_at": (
                    by_version[d.to_version_id].recorded_at
                    if d.to_version_id in by_version
                    else None
                ),
            }
        )

    db.commit()
    return {
        "versions": [
            {
                "uid": v.uid,
                "person_name": (
                    persons[v.person_id].full_name
                    if v.person_id in persons
                    else "Unknown"
                ),
                "version": v.version,
                "recorded_at": v.recorded_at,
                "language": v.language,
                "content": v.content,
            }
            for v in sorted(versions, key=lambda x: (x.person_id, x.version))
        ],
        "diffs": diffs,
        "count": len(diffs),
        "framing": (
            "An investigative flag for human review. A changed account is not a "
            "finding that a witness is unreliable or untruthful -- memory shifts, "
            "and the reason for a change is a question for an officer, not a model."
        ),
    }


@router.get("/cases/{case_ref}/correlation")
def digital_correlation(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Phone / tower / CCTV cross-checks against the case timeline."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="CORRELATION_VIEW"
    )
    findings = [
        {
            "uid": f.uid,
            "title": f.title,
            "description": f.description,
            "correlation_type": f.correlation_type,
            "agreement": f.agreement,
            "confidence": f.confidence,
            "occurred_at": f.occurred_at,
            "status": f.status,
        }
        for f in db.execute(
            select(CorrelationFinding).where(CorrelationFinding.case_id == case.id)
        ).scalars()
    ]
    records = [
        {
            "uid": r.uid,
            "msisdn_masked": r.msisdn_masked,
            "counterparty_masked": r.counterparty_masked,
            "record_type": r.record_type,
            "occurred_at": r.occurred_at,
            "duration_s": r.duration_s,
            "tower_label": r.tower_label,
            "tower_lat": r.tower_lat,
            "tower_lon": r.tower_lon,
        }
        for r in db.execute(
            select(PhoneRecord).where(PhoneRecord.case_id == case.id)
        ).scalars()
    ]
    db.commit()
    return {"findings": findings, "records": records, "count": len(findings)}


@router.get("/cases/{case_ref}/location")
def location_analysis(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Location points plus explainable region scores for the forensic map."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="LOCATION_VIEW"
    )
    points = [
        {
            "uid": p.uid,
            "label": p.label,
            "point_type": p.point_type,
            "lat": p.lat,
            "lon": p.lon,
            "occurred_at": p.occurred_at,
            "source_reliability": p.source_reliability,
            "verification_status": p.verification_status,
            "evidence_id": p.evidence_id,
        }
        for p in db.execute(
            select(LocationPoint).where(LocationPoint.case_id == case.id)
        ).scalars()
    ]
    regions = [
        {
            "uid": s.uid,
            "label": s.label,
            "center_lat": s.center_lat,
            "center_lon": s.center_lon,
            "radius_m": s.radius_m,
            "score": s.score,
            "rank": s.rank,
            "factors": json.loads(s.factors or "[]"),
            "method": s.method,
        }
        for s in sorted(
            db.execute(
                select(LocationScore).where(LocationScore.case_id == case.id)
            ).scalars(),
            key=lambda x: x.rank,
        )
    ]
    db.commit()
    return {
        "points": points,
        "regions": regions,
        "method_note": (
            "Rule-based geospatial scoring, not a predictive machine-learning model. "
            "Every region exposes the factors and arithmetic behind its score. "
            "Intended for search prioritisation only."
        ),
    }


@router.get("/cases/{case_ref}/autopsy")
def autopsy_analysis(
    case_ref: str,
    db: Session = Depends(db_session),
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(request_context),
) -> dict[str, Any]:
    """Post-mortem findings and AI hypotheses, bound to 3D anatomical regions."""
    case = get_case_or_404(
        db, case_id=case_ref, actor=user, ctx=ctx, action="AUTOPSY_VIEW"
    )
    report = (
        db.execute(select(AutopsyReport).where(AutopsyReport.case_id == case.id))
        .scalars()
        .first()
    )
    if report is None:
        db.commit()
        return {
            "report": None,
            "findings": [],
            "hypotheses": [],
            "disclaimer": AutopsyHypothesis.DISCLAIMER,
        }

    findings = [
        {
            "uid": f.uid,
            "region_id": f.region_id,
            "region_label": f.region_label,
            "layer": f.layer,
            "finding_type": f.finding_type,
            "description": f.description,
            "severity": f.severity,
            "is_examiner_recorded": f.is_examiner_recorded,
        }
        for f in db.execute(
            select(AutopsyFinding).where(AutopsyFinding.report_id == report.id)
        ).scalars()
    ]
    hypotheses = [
        {
            "uid": h.uid,
            "title": h.title,
            "hypothesis": h.hypothesis,
            "reasoning": h.reasoning,
            "hypothesis_type": h.hypothesis_type,
            "confidence": h.confidence,
            "disclaimer": h.disclaimer,
            "status": h.status,
            "finding_id": h.finding_id,
        }
        for h in db.execute(
            select(AutopsyHypothesis).where(AutopsyHypothesis.report_id == report.id)
        ).scalars()
    ]
    db.commit()
    return {
        "report": {
            "uid": report.uid,
            "examined_at": report.examined_at,
            "examiner_name": report.examiner_name,
            "estimated_tod_earliest": report.estimated_tod_earliest,
            "estimated_tod_latest": report.estimated_tod_latest,
            "toxicology": report.toxicology,
            "summary": report.summary,
        },
        "findings": findings,
        "hypotheses": hypotheses,
        "disclaimer": AutopsyHypothesis.DISCLAIMER,
    }

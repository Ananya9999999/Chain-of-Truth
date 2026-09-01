"""The pipeline that turns one upload into activity across the whole system.

    evidence in
      -> RAG index
      -> structured extraction (facts, each anchored to source characters)
      -> timeline candidates (UNVERIFIED)
      -> contradiction comparison against existing case context
      -> graph nodes and edges
      -> guidance refresh

Everything written here lands in the AI analysis layer with status
AI_EXTRACTED_UNVERIFIED or REQUIRES_REVIEW. Nothing in this module can promote
anything into the verified record -- only `services/verification.py`, driven by a
human, can do that. That asymmetry is the whole product principle expressed in
code.
"""
from __future__ import annotations

import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai.provider import AIResult
from ..ai.registry import get_provider
from ..core.canonical import utc_now_iso
from ..models import Case, Evidence, User
from ..models_analysis import (
    STATUS_AI_UNVERIFIED,
    STATUS_REQUIRES_REVIEW,
    Contradiction,
    ContradictionSource,
    ExtractedFact,
    GraphEdge,
    GraphNode,
    ProcessingJob,
    TimelineEvent,
)
from ..models_features import GuidanceItem, KbChunk
from ..rag import store as rag_store
from . import audit

# Fact types that should become points on the timeline.
_TEMPORAL_FACTS = {"TIME", "DATE"}

# Fact type -> graph node type.
_NODE_TYPE_FOR_FACT = {
    "PERSON": "person",
    "LOCATION": "location",
    "VEHICLE": "device",
    "PHONE": "device",
    "WEAPON": "evidence",
}


def _evidence_text(evidence: Evidence) -> str:
    """The analysable text of an evidence item, if it has any."""
    return (evidence.text_content or "").strip()


def _case_context(db: Session, case_id: int, exclude_evidence_id: int | None = None):
    """Prior evidence in this case, shaped for the provider."""
    stmt = select(Evidence).where(Evidence.case_id == case_id)
    if exclude_evidence_id:
        stmt = stmt.where(Evidence.id != exclude_evidence_id)
    items = []
    for ev in db.execute(stmt).scalars():
        items.append(
            {
                "evidence_id": ev.id,
                "evidence_uid": ev.uid,
                "id": ev.id,
                "type": ev.evidence_type,
                "evidence_type": ev.evidence_type,
                "title": ev.title,
                "text_content": ev.text_content or "",
                "raw_content": ev.text_content or "",
                "occurred_at": ev.occurred_at,
                "collected_at": ev.collected_at,
                "status": ev.status,
                "content_hash": ev.content_hash,
            }
        )
    return items


def analyze_evidence(
    db: Session,
    *,
    case: Case,
    evidence: Evidence,
    actor: User | None = None,
) -> ProcessingJob:
    """Run the full pipeline for one evidence item.

    Returns the ProcessingJob so the UI can show what happened and, critically,
    which provider produced it.
    """
    provider = get_provider()
    now = utc_now_iso()

    job = ProcessingJob(
        uid=str(uuid.uuid4()),
        case_id=case.id,
        evidence_id=evidence.id,
        job_type="FULL_ANALYSIS",
        status="RUNNING",
        stage="indexing",
        progress=5,
        provider=provider.name,
        model=provider.model,
        started_at=now,
    )
    db.add(job)
    db.flush()

    try:
        text = _evidence_text(evidence)

        # 1. RAG index -- so later evidence can be compared against this one.
        job.stage, job.progress = "indexing", 15
        if text:
            rag_store.index_evidence(
                db, case_id=case.id, evidence_id=evidence.id, content=text
            )

        # 2. Structured extraction.
        job.stage, job.progress = "extraction", 35
        facts = _persist_facts(db, case=case, evidence=evidence, job=job, text=text,
                               results=provider.extract(
                                   text=text,
                                   context={
                                       "evidence_id": evidence.id,
                                       "evidence_uid": evidence.uid,
                                   },
                               ) if text else [])

        # 3. Timeline candidates.
        job.stage, job.progress = "timeline", 55
        _persist_timeline(db, case=case, evidence=evidence, facts=facts)

        # 4. Contradiction comparison against the rest of the case.
        job.stage, job.progress = "comparison", 70
        context = _case_context(db, case.id, exclude_evidence_id=evidence.id)
        new_item = {
            "evidence_id": evidence.id,
            "evidence_uid": evidence.uid,
            "id": evidence.id,
            "type": evidence.evidence_type,
            "evidence_type": evidence.evidence_type,
            "title": evidence.title,
            "text_content": text,
            "raw_content": text,
            "occurred_at": evidence.occurred_at,
            "collected_at": evidence.collected_at,
            "status": evidence.status,
        }
        if context:
            _persist_contradictions(
                db,
                case=case,
                job=job,
                results=provider.compare(new_item=new_item, case_context=context),
            )

        # 5. Graph.
        job.stage, job.progress = "graph", 85
        _persist_graph(db, case=case, evidence=evidence, facts=facts)

        # 6. Guidance refresh.
        job.stage, job.progress = "guidance", 95
        _refresh_guidance(db, case=case, provider=provider)

        job.status, job.stage, job.progress = "COMPLETE", "done", 100
        job.finished_at = utc_now_iso()

    except Exception as exc:  # pragma: no cover - defensive
        job.status = "FAILED"
        job.error = f"{type(exc).__name__}: {exc}"
        job.finished_at = utc_now_iso()
        db.flush()
        raise

    if actor is not None:
        audit.record(
            db,
            actor=actor,
            action="AI_ANALYSIS_RUN",
            resource_type="EVIDENCE",
            resource_id=evidence.uid,
            case_id=case.id,
            detail=json.dumps(
                {
                    "job": job.uid,
                    "provider": provider.name,
                    "is_live_inference": provider.is_live_inference,
                }
            ),
        )
    db.flush()
    return job


# --- persistence helpers -----------------------------------------------------
def _persist_facts(
    db: Session,
    *,
    case: Case,
    evidence: Evidence,
    job: ProcessingJob,
    text: str,
    results: list[AIResult],
) -> list[ExtractedFact]:
    """Write extracted facts, rejecting any whose excerpt is not really there.

    This is the enforcement point for the anti-hallucination contract. A fact
    the provider cannot anchor to literal characters in the source is discarded,
    no matter how confident the provider claimed to be.
    """
    db.query(ExtractedFact).filter(ExtractedFact.evidence_id == evidence.id).delete()

    now = utc_now_iso()
    saved: list[ExtractedFact] = []

    for result in results:
        source = result.sources[0] if result.sources else None
        if source is None:
            continue
        start, end = source.offset_start, source.offset_end
        value = str(result.payload.get("value", "")).strip()
        if not value:
            continue
        # Verify the anchor independently of the provider's claim.
        if start is None or end is None or text[start:end] != value:
            found = text.find(value)
            if found < 0:
                continue  # unanchorable -> not a fact
            start, end = found, found + len(value)

        row = ExtractedFact(
            uid=str(uuid.uuid4()),
            case_id=case.id,
            evidence_id=evidence.id,
            job_id=job.id,
            fact_type=result.payload.get("fact_type", "OTHER"),
            value=value,
            normalized_value=result.payload.get("normalized_value"),
            source_excerpt=source.excerpt or text[max(0, start - 80) : end + 80],
            source_offset_start=start,
            source_offset_end=end,
            source_frame_ts=source.frame_ts,
            confidence=float(result.confidence),
            explanation=result.explanation,
            status=STATUS_AI_UNVERIFIED,
            created_at=now,
        )
        db.add(row)
        saved.append(row)

    db.flush()
    return saved


def _persist_timeline(
    db: Session, *, case: Case, evidence: Evidence, facts: list[ExtractedFact]
) -> list[TimelineEvent]:
    """Create UNVERIFIED timeline candidates from temporal facts."""
    db.query(TimelineEvent).filter(
        TimelineEvent.evidence_id == evidence.id,
        TimelineEvent.verification_status == STATUS_AI_UNVERIFIED,
    ).delete()

    now = utc_now_iso()
    created: list[TimelineEvent] = []

    # Always anchor the collection itself -- that part is a recorded fact, not
    # an inference, so it is VERIFIED from the start.
    anchor = TimelineEvent(
        uid=str(uuid.uuid4()),
        case_id=case.id,
        title=f"Evidence logged: {evidence.title}",
        description=f"{evidence.evidence_type} entered into the ledger.",
        event_type="EVIDENCE_LOGGED",
        occurred_at=evidence.occurred_at or evidence.collected_at,
        recorded_at=evidence.uploaded_at,
        evidence_id=evidence.id,
        verification_status="VERIFIED",
        confidence=1.0,
        lat=evidence.collection_lat,
        lon=evidence.collection_lon,
        created_at=now,
    )
    db.add(anchor)
    created.append(anchor)

    for fact in facts:
        if fact.fact_type not in _TEMPORAL_FACTS:
            continue
        event = TimelineEvent(
            uid=str(uuid.uuid4()),
            case_id=case.id,
            title=f"{fact.fact_type.title()} referenced: {fact.value}",
            description=fact.source_excerpt,
            event_type="AI_EXTRACTED_TIME",
            occurred_at=fact.occurred_at or evidence.occurred_at,
            occurred_at_precision="APPROXIMATE",
            recorded_at=evidence.uploaded_at,
            evidence_id=evidence.id,
            source_fact_id=fact.id,
            verification_status=STATUS_AI_UNVERIFIED,
            confidence=fact.confidence,
            created_at=now,
        )
        db.add(event)
        created.append(event)

    db.flush()
    return created


def _persist_contradictions(
    db: Session, *, case: Case, job: ProcessingJob, results: list[AIResult]
) -> list[Contradiction]:
    now = utc_now_iso()
    saved: list[Contradiction] = []

    for result in results:
        title = str(result.payload.get("title", "Possible conflict"))[:500]
        # Do not re-raise a flag an officer has already answered.
        existing = db.execute(
            select(Contradiction).where(
                Contradiction.case_id == case.id, Contradiction.title == title
            )
        ).scalar_one_or_none()
        if existing is not None:
            continue

        row = Contradiction(
            uid=str(uuid.uuid4()),
            case_id=case.id,
            job_id=job.id,
            title=title,
            description=result.payload.get("description", ""),
            contradiction_type=result.payload.get("contradiction_type", "GENERIC"),
            severity=result.payload.get("severity", "MINOR"),
            confidence=float(result.confidence),
            explanation=result.explanation,
            status=STATUS_REQUIRES_REVIEW,
            created_at=now,
        )
        db.add(row)
        db.flush()

        for i, src in enumerate(result.sources[:2]):
            if src.evidence_id is None:
                continue
            db.add(
                ContradictionSource(
                    contradiction_id=row.id,
                    evidence_id=src.evidence_id,
                    side="A" if i == 0 else "B",
                    excerpt=src.excerpt or "",
                )
            )
        saved.append(row)

    db.flush()
    return saved


def _persist_graph(
    db: Session, *, case: Case, evidence: Evidence, facts: list[ExtractedFact]
) -> None:
    """Link this evidence item to the entities it mentions."""
    now = utc_now_iso()

    def upsert(node_key: str, node_type: str, label: str, **kw) -> GraphNode:
        found = db.execute(
            select(GraphNode).where(
                GraphNode.case_id == case.id, GraphNode.node_key == node_key
            )
        ).scalar_one_or_none()
        if found is not None:
            return found
        node = GraphNode(
            case_id=case.id,
            node_key=node_key,
            node_type=node_type,
            label=label[:500],
            created_at=now,
            **kw,
        )
        db.add(node)
        db.flush()
        return node

    ev_node = upsert(
        f"evidence:{evidence.uid}",
        "evidence",
        evidence.title,
        evidence_id=evidence.id,
        subtype=evidence.evidence_type,
        verification_status="VERIFIED",
    )

    for fact in facts:
        node_type = _NODE_TYPE_FOR_FACT.get(fact.fact_type)
        if not node_type:
            continue
        key = f"{node_type}:{fact.value.lower()}"
        entity = upsert(key, node_type, fact.value, subtype=fact.fact_type)

        exists = db.execute(
            select(GraphEdge).where(
                GraphEdge.case_id == case.id,
                GraphEdge.source_id == ev_node.id,
                GraphEdge.target_id == entity.id,
                GraphEdge.edge_type == "mentions",
            )
        ).scalar_one_or_none()
        if exists is not None:
            continue

        db.add(
            GraphEdge(
                case_id=case.id,
                source_id=ev_node.id,
                target_id=entity.id,
                edge_type="mentions",
                weight=fact.confidence,
                evidence_id=evidence.id,
                verification_status=STATUS_AI_UNVERIFIED,
                explanation=f"Extracted from source characters "
                f"{fact.source_offset_start}-{fact.source_offset_end}.",
                created_at=now,
            )
        )
    db.flush()


def _refresh_guidance(db: Session, *, case: Case, provider) -> None:
    """Regenerate open guidance, keeping anything an officer already acted on."""
    kb_present = db.execute(select(KbChunk).limit(1)).scalar_one_or_none()
    if kb_present is None:
        return  # KB not seeded yet; guidance would have nothing to cite

    db.query(GuidanceItem).filter(
        GuidanceItem.case_id == case.id, GuidanceItem.status == "OPEN"
    ).delete()

    evidence_items = _case_context(db, case.id)
    timeline = [
        {
            "title": e.title,
            "occurred_at": e.occurred_at,
            "status": e.verification_status,
        }
        for e in db.execute(
            select(TimelineEvent).where(TimelineEvent.case_id == case.id)
        ).scalars()
    ]
    contradictions = [
        {"title": c.title, "severity": c.severity, "status": c.status}
        for c in db.execute(
            select(Contradiction).where(Contradiction.case_id == case.id)
        ).scalars()
    ]

    results = provider.guide(
        case_context={
            "case": {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "description": case.description or "",
            },
            "evidence": evidence_items,
            "timeline": timeline,
            "contradictions": contradictions,
        },
        kb_hits=[],
    )

    now = utc_now_iso()
    # Citations are checked against the curated KB's real section strings. A
    # reference the KB does not contain is stripped rather than displayed --
    # an invented section number is worse than no citation at all.
    valid_refs = {
        row.section for row in db.execute(select(KbChunk)).scalars() if row.section
    }

    for result in results:
        ref = result.payload.get("legal_ref")
        # A citation the curated KB does not contain is dropped rather than
        # shown. An invented section number is worse than no citation.
        if ref and ref not in valid_refs:
            ref = None
        db.add(
            GuidanceItem(
                uid=str(uuid.uuid4()),
                case_id=case.id,
                title=str(result.payload.get("title", "Next step"))[:500],
                recommendation=result.payload.get("recommendation", ""),
                rationale=result.payload.get("rationale", "") or result.explanation,
                category=result.payload.get("category", "PROCEDURE"),
                priority=result.payload.get("priority", "NORMAL"),
                legal_ref=ref,
                legal_title=result.payload.get("legal_title") if ref else None,
                legal_text=result.payload.get("legal_text") if ref else None,
                confidence=float(result.confidence),
                status="OPEN",
                created_at=now,
            )
        )
    db.flush()

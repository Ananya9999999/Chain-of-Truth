"""AI analysis layer, verified case layer, and the human gate between them.

The single most important structural decision in this schema:

    AI output and verified case facts live in DIFFERENT TABLES.

Not a status column on one shared table -- different tables. An AI-extracted
fact physically cannot be read by a query against the verified record until a
human writes a VerificationDecision row promoting it. That is what "AI assists,
humans decide" means when you express it as a schema instead of a slogan.

Nothing here is ever hard-deleted. A dismissed contradiction stays, marked
dismissed, with the officer and reason attached -- because the spec requires
courts to see the AI flag *and* how the officer responded.
"""
from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base

# --- shared vocabulary -------------------------------------------------------
# These six strings are the whole verification vocabulary, mirrored verbatim in
# the frontend StatusChip component.
STATUS_VERIFIED = "VERIFIED"
STATUS_AI_UNVERIFIED = "AI_EXTRACTED_UNVERIFIED"
STATUS_AI_HYPOTHESIS = "AI_HYPOTHESIS"
STATUS_HUMAN_CONFIRMED = "HUMAN_CONFIRMED"
STATUS_DISMISSED = "DISMISSED"
STATUS_REQUIRES_REVIEW = "REQUIRES_REVIEW"

VERIFICATION_STATUSES = (
    STATUS_VERIFIED,
    STATUS_AI_UNVERIFIED,
    STATUS_AI_HYPOTHESIS,
    STATUS_HUMAN_CONFIRMED,
    STATUS_DISMISSED,
    STATUS_REQUIRES_REVIEW,
)

SEVERITY_MINOR = "MINOR"
SEVERITY_MAJOR = "MAJOR"
SEVERITY_CRITICAL = "CRITICAL"

DECISION_CONFIRM = "CONFIRM"
DECISION_DISMISS = "DISMISS"
DECISION_REQUEST_REVIEW = "REQUEST_REVIEW"


# --- AI processing bookkeeping -----------------------------------------------
class ProcessingJob(Base):
    """One AI pipeline run. Drives the live "AI is thinking" state in the UI."""

    __tablename__ = "processing_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True, index=True
    )
    job_type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="QUEUED", index=True)
    stage: Mapped[str | None] = mapped_column(String(64), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    # Which provider actually produced this. "mock" must never be displayed as
    # real inference, so it is recorded per-job rather than read from config
    # at render time.
    provider: Mapped[str] = mapped_column(String(32), default="mock")
    model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[str] = mapped_column(String(32))
    finished_at: Mapped[str | None] = mapped_column(String(32), nullable=True)


# --- AI analysis layer (UNVERIFIED until a human acts) -----------------------
class ExtractedFact(Base):
    """One structured fact the AI pulled out of one evidence item.

    ``source_excerpt`` plus the character offsets are NOT optional. The spec's
    fix for hallucination is that every extracted fact is displayed next to the
    exact text it came from, so a fact whose excerpt cannot be located in the
    source is rejected by the extraction service before it reaches this table.
    """

    __tablename__ = "extracted_facts"
    __table_args__ = (Index("ix_fact_case_status", "case_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)
    job_id: Mapped[int | None] = mapped_column(
        ForeignKey("processing_jobs.id"), nullable=True
    )

    fact_type: Mapped[str] = mapped_column(String(64), index=True)
    subject: Mapped[str | None] = mapped_column(String(512), nullable=True)
    predicate: Mapped[str | None] = mapped_column(String(255), nullable=True)
    value: Mapped[str] = mapped_column(Text)
    normalized_value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    occurred_at: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Provenance -- the anti-hallucination contract.
    source_excerpt: Mapped[str] = mapped_column(Text)
    source_offset_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_offset_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_frame_ts: Mapped[str | None] = mapped_column(String(32), nullable=True)

    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    explanation: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(16), default="en")

    status: Mapped[str] = mapped_column(
        String(32), default=STATUS_AI_UNVERIFIED, index=True
    )
    created_at: Mapped[str] = mapped_column(String(32))


class Contradiction(Base):
    """A conflict the AI noticed between two pieces of evidence.

    A prompt for an officer to look closer -- never a verdict. Dismissing one
    sets status=DISMISSED and writes a VerificationDecision; the row itself is
    never removed.
    """

    __tablename__ = "contradictions"
    __table_args__ = (Index("ix_contra_case_status", "case_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    job_id: Mapped[int | None] = mapped_column(
        ForeignKey("processing_jobs.id"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text)
    contradiction_type: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(32), index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    explanation: Mapped[str] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String(32), default=STATUS_REQUIRES_REVIEW, index=True
    )
    resolved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    resolved_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class ContradictionSource(Base):
    """One side of a contradiction, with the exact words that conflict."""

    __tablename__ = "contradiction_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contradiction_id: Mapped[int] = mapped_column(
        ForeignKey("contradictions.id"), index=True
    )
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)
    fact_id: Mapped[int | None] = mapped_column(
        ForeignKey("extracted_facts.id"), nullable=True
    )
    side: Mapped[str] = mapped_column(String(8))
    excerpt: Mapped[str] = mapped_column(Text)
    claimed_value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    claimed_at: Mapped[str | None] = mapped_column(String(32), nullable=True)


# --- the human gate ----------------------------------------------------------
class VerificationDecision(Base):
    """Append-only record of a human accepting or rejecting an AI output.

    This table is the ONLY bridge from the AI layer to the verified layer. It is
    also the "audit trail of due diligence" the pitch leans on: for every AI flag
    there is a row saying which human looked at it, when, and what they decided
    -- including when they decided the AI was wrong.
    """

    __tablename__ = "verification_decisions"
    __table_args__ = (
        Index("ix_decision_target", "target_type", "target_id"),
        Index("ix_decision_case", "case_id", "decided_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(64))
    target_id: Mapped[int] = mapped_column(Integer)
    target_uid: Mapped[str | None] = mapped_column(String(36), nullable=True)

    decision: Mapped[str] = mapped_column(String(32), index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    decided_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    decided_by_role: Mapped[str] = mapped_column(String(64))
    decided_at: Mapped[str] = mapped_column(String(32))

    # What the AI originally said, frozen at decision time. Preserved even if
    # the officer overrides it, so the original machine output stays auditable.
    ai_state_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)


# --- verified case layer -----------------------------------------------------
class TimelineEvent(Base):
    """The shared case timeline every feature reads from and writes back to.

    Ordered by ``occurred_at`` (when it happened), not ``recorded_at`` (when it
    was logged) -- the spec is explicit that these are different things and that
    conflating them is part of the problem.
    """

    __tablename__ = "timeline_events"
    __table_args__ = (Index("ix_timeline_case_time", "case_id", "occurred_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)

    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    occurred_at: Mapped[str | None] = mapped_column(String(32), index=True)
    occurred_at_precision: Mapped[str] = mapped_column(String(16), default="EXACT")
    recorded_at: Mapped[str] = mapped_column(String(32))

    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True, index=True
    )
    source_fact_id: Mapped[int | None] = mapped_column(
        ForeignKey("extracted_facts.id"), nullable=True
    )

    verification_status: Mapped[str] = mapped_column(
        String(32), default=STATUS_AI_UNVERIFIED, index=True
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


# --- people (PII lives here, redacted by role) -------------------------------
class Person(Base):
    """A person in the case: suspect, witness, victim, doctor, or relation.

    Officers are Users. Everyone else is a Person. ``is_protected`` marks
    victims and witnesses whose identifying fields are stripped for roles that
    do not need them (spec section 7, data minimization).
    """

    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    person_type: Mapped[str] = mapped_column(String(64), index=True)
    alias: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # PII -- restricted by role at serialization time.
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_protected: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class PersonRelationship(Base):
    """Family-tree and suspect-tree edges between persons."""

    __tablename__ = "person_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    from_person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    to_person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    relationship_type: Mapped[str] = mapped_column(String(64))
    tree: Mapped[str] = mapped_column(String(32), default="FAMILY")
    verification_status: Mapped[str] = mapped_column(
        String(32), default=STATUS_AI_UNVERIFIED
    )
    created_at: Mapped[str] = mapped_column(String(32))


# --- evidence graph ----------------------------------------------------------
class GraphNode(Base):
    """A person / place / event / evidence / device node in the case graph."""

    __tablename__ = "graph_nodes"
    __table_args__ = (
        UniqueConstraint("case_id", "node_key", name="uq_graph_node_key"),
        Index("ix_graph_node_case_type", "case_id", "node_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    node_key: Mapped[str] = mapped_column(String(255))
    node_type: Mapped[str] = mapped_column(String(64), index=True)
    label: Mapped[str] = mapped_column(String(512))
    subtype: Mapped[str | None] = mapped_column(String(64), nullable=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )
    person_id: Mapped[int | None] = mapped_column(ForeignKey("persons.id"), nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(32), default=STATUS_AI_UNVERIFIED
    )
    # Non-PII display attributes only; sensitive fields live on Person.
    attributes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class GraphEdge(Base):
    """A typed relationship between two graph nodes."""

    __tablename__ = "graph_edges"
    __table_args__ = (Index("ix_graph_edge_case", "case_id", "edge_type"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("graph_nodes.id"), index=True)
    target_id: Mapped[int] = mapped_column(ForeignKey("graph_nodes.id"), index=True)
    # supports | contradicts | mentions | related_to | located_at | derived_from
    edge_type: Mapped[str] = mapped_column(String(64), index=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(32), default=STATUS_AI_UNVERIFIED
    )
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))

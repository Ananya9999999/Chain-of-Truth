"""Feature-layer tables: guidance, gaps, autopsy, chargesheet, location,
statements, similarity, digital correlation, custody, and RAG storage.

Every AI-derived row here carries confidence + explanation + a source reference,
and none of them is treated as a conclusion. The autopsy and chargesheet tables
in particular exist to flag investigation gaps for a qualified human, which is
why they store a mandatory ``disclaimer`` rather than relying on the UI to
remember to add one.

Embedding storage note: embeddings are kept as JSON text so the same schema runs
on SQLite (tests, offline dev) and PostgreSQL. On PostgreSQL the migration adds
a real ``vector`` column plus an HNSW index and backfills it, so pgvector does
the similarity search in the database rather than in Python.
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
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


# --- investigation guidance --------------------------------------------------
class GuidanceItem(Base):
    """One checklist suggestion, grounded in a curated legal/procedural rule.

    ``legal_ref`` is validated against the curated knowledge base before the row
    is written: a citation the KB does not contain is dropped rather than shown.
    A checklist assistant that invents section numbers is worse than no
    assistant at all.
    """

    __tablename__ = "guidance_items"
    __table_args__ = (Index("ix_guidance_case_status", "case_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)

    title: Mapped[str] = mapped_column(String(512))
    recommendation: Mapped[str] = mapped_column(Text)
    rationale: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), index=True)
    priority: Mapped[str] = mapped_column(String(32), default="NORMAL")

    # Citation into the curated KB, not model memory.
    legal_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    legal_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    legal_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="OPEN", index=True)
    acknowledged_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    acknowledged_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class EvidenceGap(Base):
    """Something the case is missing, detected by rule + retrieval."""

    __tablename__ = "evidence_gaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text)
    gap_type: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(32), default="MINOR")
    suggested_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="OPEN", index=True)
    resolved_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


# --- autopsy / post-mortem ---------------------------------------------------
class AutopsyReport(Base):
    """A post-mortem report attached to a case, entered by a forensic officer."""

    __tablename__ = "autopsy_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )
    deceased_person_id: Mapped[int | None] = mapped_column(
        ForeignKey("persons.id"), nullable=True
    )

    examined_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    examiner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estimated_tod_earliest: Mapped[str | None] = mapped_column(String(32), nullable=True)
    estimated_tod_latest: Mapped[str | None] = mapped_column(String(32), nullable=True)
    toxicology: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class AutopsyFinding(Base):
    """One anatomical finding, bound to a named region of the 3D model.

    ``region_id`` keys into frontend/public/models/anatomy/regions.json. The
    viewer highlights a region ONLY when a finding references it -- the model
    can never invent anatomy that is not in the case data.
    """

    __tablename__ = "autopsy_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("autopsy_reports.id"), index=True)

    region_id: Mapped[str] = mapped_column(String(64), index=True)
    region_label: Mapped[str] = mapped_column(String(255))
    layer: Mapped[str] = mapped_column(String(32), default="external")
    finding_type: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(32), default="MINOR")
    # Recorded by the examiner (a fact) rather than inferred by the model.
    is_examiner_recorded: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(String(32))


class AutopsyHypothesis(Base):
    """An AI cross-reference between medical findings and the case timeline.

    Never a diagnosis. ``disclaimer`` is a stored column, not UI decoration, so
    the label travels with the data into any export or API response.
    """

    __tablename__ = "autopsy_hypotheses"

    DISCLAIMER = (
        "AI-generated investigative hypothesis - requires forensic medical "
        "officer review. Not a medical diagnosis or cause-of-death conclusion."
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    report_id: Mapped[int | None] = mapped_column(
        ForeignKey("autopsy_reports.id"), nullable=True
    )
    finding_id: Mapped[int | None] = mapped_column(
        ForeignKey("autopsy_findings.id"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(512))
    hypothesis: Mapped[str] = mapped_column(Text)
    reasoning: Mapped[str] = mapped_column(Text)
    hypothesis_type: Mapped[str] = mapped_column(String(64), index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    disclaimer: Mapped[str] = mapped_column(Text, default=DISCLAIMER)

    status: Mapped[str] = mapped_column(
        String(32), default="AI_HYPOTHESIS", index=True
    )
    reviewed_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


# --- chargesheet QA ----------------------------------------------------------
class Chargesheet(Base):
    __tablename__ = "chargesheets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(512))
    draft_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    sections: Mapped[str | None] = mapped_column(Text, nullable=True)
    prepared_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="DRAFT")
    created_at: Mapped[str] = mapped_column(String(32))


class ChargesheetFinding(Base):
    """One claim in the chargesheet checked against the verified timeline.

    Verdicts: PASS | WARNING | CONFLICT | MISSING_SUPPORT. Pre-filing QA for a
    human legal reviewer -- explicitly not a legal opinion on case strength.
    """

    __tablename__ = "chargesheet_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    chargesheet_id: Mapped[int] = mapped_column(
        ForeignKey("chargesheets.id"), index=True
    )

    claim: Mapped[str] = mapped_column(Text)
    verdict: Mapped[str] = mapped_column(String(32), index=True)
    explanation: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    supporting_evidence_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    conflicting_evidence_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="OPEN")
    created_at: Mapped[str] = mapped_column(String(32))


# --- geospatial --------------------------------------------------------------
class LocationPoint(Base):
    """Any point the case knows about: evidence GPS, CCTV, phone ping, sighting."""

    __tablename__ = "location_points"
    __table_args__ = (Index("ix_locpoint_case_time", "case_id", "occurred_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )
    person_id: Mapped[int | None] = mapped_column(ForeignKey("persons.id"), nullable=True)

    label: Mapped[str] = mapped_column(String(255))
    point_type: Mapped[str] = mapped_column(String(64), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    occurred_at: Mapped[str | None] = mapped_column(String(32), index=True)
    # How much this source is trusted by the scorer (CCTV > witness memory).
    source_reliability: Mapped[float] = mapped_column(Float, default=0.5)
    verification_status: Mapped[str] = mapped_column(
        String(32), default="AI_EXTRACTED_UNVERIFIED"
    )
    created_at: Mapped[str] = mapped_column(String(32))


class LocationScore(Base):
    """A scored search region.

    Rule-based, not ML. ``factors`` holds the full numeric breakdown so the UI
    can answer "why did this region score 0.72?" with actual arithmetic instead
    of a black box.
    """

    __tablename__ = "location_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    label: Mapped[str] = mapped_column(String(255))
    center_lat: Mapped[float] = mapped_column(Float)
    center_lon: Mapped[float] = mapped_column(Float)
    radius_m: Mapped[float] = mapped_column(Float, default=500.0)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    rank: Mapped[int] = mapped_column(Integer, default=0)
    factors: Mapped[str] = mapped_column(Text)
    method: Mapped[str] = mapped_column(String(64), default="rule_based_v1")
    computed_at: Mapped[str] = mapped_column(String(32))


class PhoneRecord(Base):
    """Call / tower records for digital evidence correlation."""

    __tablename__ = "phone_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )
    person_id: Mapped[int | None] = mapped_column(ForeignKey("persons.id"), nullable=True)

    msisdn_masked: Mapped[str] = mapped_column(String(32))
    counterparty_masked: Mapped[str | None] = mapped_column(String(32), nullable=True)
    record_type: Mapped[str] = mapped_column(String(32))
    occurred_at: Mapped[str] = mapped_column(String(32), index=True)
    duration_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tower_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    tower_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    tower_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class CorrelationFinding(Base):
    """A cross-source correlation (or conflict) between digital and case data."""

    __tablename__ = "correlation_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text)
    correlation_type: Mapped[str] = mapped_column(String(64), index=True)
    agreement: Mapped[str] = mapped_column(String(32))
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    source_refs: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="AI_EXTRACTED_UNVERIFIED")
    created_at: Mapped[str] = mapped_column(String(32))


# --- statements --------------------------------------------------------------
class StatementVersion(Base):
    """One recorded version of a witness statement.

    Multiple versions let the reliability checker show exactly what changed
    between interviews. The framing is an investigative flag for a human, never
    a legal conclusion that a witness is "unreliable".
    """

    __tablename__ = "statement_versions"
    __table_args__ = (Index("ix_stmt_person_ver", "person_id", "version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True
    )

    version: Mapped[int] = mapped_column(Integer, default=1)
    recorded_at: Mapped[str] = mapped_column(String(32))
    recorded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    language: Mapped[str] = mapped_column(String(16), default="en")
    content: Mapped[str] = mapped_column(Text)
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class StatementDiff(Base):
    """A detected change between two statement versions."""

    __tablename__ = "statement_diffs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    from_version_id: Mapped[int] = mapped_column(
        ForeignKey("statement_versions.id")
    )
    to_version_id: Mapped[int] = mapped_column(ForeignKey("statement_versions.id"))

    change_type: Mapped[str] = mapped_column(String(64), index=True)
    field: Mapped[str | None] = mapped_column(String(128), nullable=True)
    before_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    significance: Mapped[str] = mapped_column(String(32), default="MINOR")
    explanation: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="REQUIRES_REVIEW")
    created_at: Mapped[str] = mapped_column(String(32))


# --- case similarity ---------------------------------------------------------
class SimilarityMatch(Base):
    """A pattern/MO overlap with another case. Similarity is not proof."""

    __tablename__ = "similarity_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    matched_case_id: Mapped[int | None] = mapped_column(
        ForeignKey("cases.id"), nullable=True
    )
    matched_case_number: Mapped[str] = mapped_column(String(64))
    matched_case_title: Mapped[str | None] = mapped_column(String(512), nullable=True)

    similarity_score: Mapped[float] = mapped_column(Float, default=0.0)
    matched_features: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text)
    method: Mapped[str] = mapped_column(String(64), default="embedding_cosine")
    status: Mapped[str] = mapped_column(String(32), default="AI_EXTRACTED_UNVERIFIED")
    created_at: Mapped[str] = mapped_column(String(32))


# --- chain of custody --------------------------------------------------------
class CustodyTransfer(Base):
    """Hand-over of physical custody. Append-only, chained into the ledger."""

    __tablename__ = "custody_transfers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer, default=1)

    from_officer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    to_officer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    to_custodian_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    reason: Mapped[str] = mapped_column(String(512))
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    condition_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    transferred_at: Mapped[str] = mapped_column(String(32))
    signature: Mapped[str | None] = mapped_column(String(256), nullable=True)
    ledger_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("ledger_entries.id"), nullable=True
    )
    created_at: Mapped[str] = mapped_column(String(32))


# --- RAG storage -------------------------------------------------------------
class EvidenceChunk(Base):
    """A chunk of evidence text plus its embedding, scoped to one case.

    ``offset_start``/``offset_end`` are retained through chunking so a retrieved
    chunk can always be traced back to exact characters in the source document.
    """

    __tablename__ = "evidence_chunks"
    __table_args__ = (Index("ix_chunk_case", "case_id", "evidence_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)

    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    content: Mapped[str] = mapped_column(Text)
    offset_start: Mapped[int] = mapped_column(Integer, default=0)
    offset_end: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(16), default="en")
    token_estimate: Mapped[int] = mapped_column(Integer, default=0)
    # JSON array; mirrored into a pgvector column on PostgreSQL.
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class KbChunk(Base):
    """A chunk of the curated legal/procedural knowledge base.

    Separate from EvidenceChunk on purpose: guidance retrieval must draw only
    from curated law, never from case text or model memory.
    """

    __tablename__ = "kb_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    kb_id: Mapped[str] = mapped_column(String(64), index=True)
    section: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(512))
    category: Mapped[str] = mapped_column(String(64), index=True)
    content: Mapped[str] = mapped_column(Text)
    triggers: Mapped[str | None] = mapped_column(Text, nullable=True)
    checklist: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_citation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))

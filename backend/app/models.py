"""Database models for the tamper-proof evidence ledger.

Design notes that matter for the pitch:
  * Timestamps that get hashed are stored as canonical ISO-8601 strings so the
    digest is reproducible byte-for-byte on re-verification.
  * There are no UPDATE paths for LedgerEntry, AuditLogEntry, EvidenceSignature
    or DeviceMetadata. They are append-only by construction, not by convention.
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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# --- enumerated values (kept as plain strings for SQLite friendliness) --------

ROLES = ("INVESTIGATING_OFFICER", "SUPERVISOR", "FORENSIC_REVIEWER", "LEGAL_REVIEWER")

EVIDENCE_STATUS_PENDING = "PENDING_CONFIRMATION"
EVIDENCE_STATUS_CONFIRMED = "CONFIRMED"
EVIDENCE_STATUS_REJECTED = "REJECTED"

SIGNER_ROLE_COLLECTING = "COLLECTING_OFFICER"
SIGNER_ROLE_WITNESSING = "WITNESSING_OFFICER"


class User(Base):
    """An officer / reviewer.

    ``role`` exists so Part 5 can layer role-based access control on top without
    a schema migration. Part 1 records the role and audits every access; it does
    not enforce permission tiers.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    badge_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(64), default="INVESTIGATING_OFFICER")
    station: Mapped[str | None] = mapped_column(String(255), nullable=True)
    public_key: Mapped[str] = mapped_column(String(128))
    # DEMO ONLY: see app/core/signing.py -- production keeps this on the device.
    private_key: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[str] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="OPEN")
    station: Mapped[str | None] = mapped_column(String(255), nullable=True)
    opened_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[str] = mapped_column(String(32))

    opened_by: Mapped[User] = relationship()
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="case")


class Evidence(Base):
    """One logged evidence item plus its integrity facts."""

    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uid: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)

    evidence_type: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Plain-text evidence (statements, reports) is kept inline so the Part 2
    # extraction pipeline can read it without touching the filesystem.
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    file_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    # SHA-256 of the evidence bytes (file bytes, or the text payload for
    # text-only items). This is what the hash chain commits to.
    content_hash: Mapped[str] = mapped_column(String(64), index=True)

    # When the event happened / evidence was collected, vs. when it reached the
    # server. The spec is explicit that these are different things.
    occurred_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    collected_at: Mapped[str] = mapped_column(String(32))
    uploaded_at: Mapped[str] = mapped_column(String(32))

    collection_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    collection_lon: Mapped[float | None] = mapped_column(Float, nullable=True)

    collecting_officer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    witnessing_officer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(32), default=EVIDENCE_STATUS_PENDING, index=True
    )
    requires_two_person: Mapped[bool] = mapped_column(Boolean, default=True)
    confirmed_at: Mapped[str | None] = mapped_column(String(32), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Offline-first bookkeeping
    was_offline: Mapped[bool] = mapped_column(Boolean, default=False)
    client_uuid: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    recorded_at_device: Mapped[str | None] = mapped_column(String(32), nullable=True)
    synced_at: Mapped[str | None] = mapped_column(String(32), nullable=True)

    case: Mapped[Case] = relationship(back_populates="evidence")
    signatures: Mapped[list["EvidenceSignature"]] = relationship(back_populates="evidence")
    device_metadata: Mapped["DeviceMetadata | None"] = relationship(
        back_populates="evidence", uselist=False
    )


class EvidenceSignature(Base):
    """Append-only Ed25519 attestation by one officer over one evidence item."""

    __tablename__ = "evidence_signatures"
    __table_args__ = (
        UniqueConstraint("evidence_id", "signer_role", name="uq_signature_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)
    signer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    signer_role: Mapped[str] = mapped_column(String(32))
    signature: Mapped[str] = mapped_column(String(256))
    signed_payload_hash: Mapped[str] = mapped_column(String(64))
    signed_at: Mapped[str] = mapped_column(String(32))

    evidence: Mapped[Evidence] = relationship(back_populates="signatures")
    signer: Mapped[User] = relationship()


class DeviceMetadata(Base):
    """Capture-device facts locked at upload time. Written once, never updated."""

    __tablename__ = "device_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), unique=True)

    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    capture_timestamp: Mapped[str | None] = mapped_column(String(32), nullable=True)
    gps_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_metadata: Mapped[str] = mapped_column(Text)
    metadata_hash: Mapped[str] = mapped_column(String(64))
    locked_at: Mapped[str] = mapped_column(String(32))

    # Cross-check of capture GPS/time against the officer's logged shift.
    cross_check_result: Mapped[str] = mapped_column(String(32))
    cross_check_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    cross_check_distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    evidence: Mapped[Evidence] = relationship(back_populates="device_metadata")


class OfficerShift(Base):
    """Where an officer was rostered, used to cross-check device metadata."""

    __tablename__ = "officer_shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    officer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    started_at: Mapped[str] = mapped_column(String(32))
    ended_at: Mapped[str] = mapped_column(String(32))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    radius_m: Mapped[float] = mapped_column(Float, default=2000.0)
    location_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))


class LedgerEntry(Base):
    """One link in a case hash chain. Append-only.

    entry_hash = SHA256(canonical({seq, case_number, event_type, actor_id,
                                   created_at, payload_hash, prev_hash}))

    Altering any past entry changes its entry_hash, which is the prev_hash of
    the next entry, so every later link breaks too.
    """

    __tablename__ = "ledger_entries"
    __table_args__ = (
        UniqueConstraint("case_id", "seq", name="uq_ledger_case_seq"),
        Index("ix_ledger_case_seq", "case_id", "seq"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    evidence_id: Mapped[int | None] = mapped_column(
        ForeignKey("evidence.id"), nullable=True, index=True
    )
    payload: Mapped[str] = mapped_column(Text)
    payload_hash: Mapped[str] = mapped_column(String(64))
    prev_hash: Mapped[str] = mapped_column(String(64))
    entry_hash: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[str] = mapped_column(String(32))


class AuditLogEntry(Base):
    """Every view/access/action, hash-chained the same way as the ledger.

    The spec calls for auditing *reads*, not just edits, so this table is
    written by GET routes as well as by mutations.
    """

    __tablename__ = "audit_log"
    __table_args__ = (UniqueConstraint("seq", name="uq_audit_seq"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seq: Mapped[int] = mapped_column(Integer, index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    action: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str] = mapped_column(String(64), index=True)
    resource_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    case_id: Mapped[int | None] = mapped_column(
        ForeignKey("cases.id"), nullable=True, index=True
    )
    outcome: Mapped[str] = mapped_column(String(32), default="ALLOWED")
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))
    prev_hash: Mapped[str] = mapped_column(String(64))
    entry_hash: Mapped[str] = mapped_column(String(64), index=True)

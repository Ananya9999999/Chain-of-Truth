"""Request/response models for the Part 1 API."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

# --- users / officers --------------------------------------------------------


class UserCreate(BaseModel):
    badge_number: str = Field(..., max_length=64)
    full_name: str = Field(..., max_length=255)
    role: Literal[
        "INVESTIGATING_OFFICER", "SUPERVISOR", "FORENSIC_REVIEWER", "LEGAL_REVIEWER"
    ] = "INVESTIGATING_OFFICER"
    station: str | None = None


class UserOut(BaseModel):
    id: int
    badge_number: str
    full_name: str
    role: str
    station: str | None
    public_key: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class ShiftCreate(BaseModel):
    """Where an officer was rostered -- used to cross-check device metadata."""

    started_at: str
    ended_at: str
    lat: float
    lon: float
    radius_m: float = 2000.0
    location_label: str | None = None


class ShiftOut(BaseModel):
    id: int
    officer_id: int
    started_at: str
    ended_at: str
    lat: float
    lon: float
    radius_m: float
    location_label: str | None

    model_config = {"from_attributes": True}


# --- cases -------------------------------------------------------------------


class CaseCreate(BaseModel):
    case_number: str = Field(..., max_length=64)
    title: str = Field(..., max_length=512)
    description: str | None = None
    station: str | None = None


class CaseOut(BaseModel):
    id: int
    case_number: str
    title: str
    description: str | None
    status: str
    station: str | None
    opened_by_id: int
    created_at: str

    model_config = {"from_attributes": True}


class CaseDetail(CaseOut):
    ledger: dict
    evidence_counts: dict


# --- evidence ----------------------------------------------------------------


class DeviceMetadataIn(BaseModel):
    """Capture-device facts, locked at upload and never editable afterwards."""

    device_id: str | None = None
    device_model: str | None = None
    capture_timestamp: str | None = None
    gps_lat: float | None = None
    gps_lon: float | None = None
    gps_accuracy_m: float | None = None

    model_config = {"extra": "allow"}


class DeviceMetadataOut(BaseModel):
    device_id: str | None
    device_model: str | None
    capture_timestamp: str | None
    gps_lat: float | None
    gps_lon: float | None
    gps_accuracy_m: float | None
    metadata_hash: str
    locked_at: str
    cross_check_result: str
    cross_check_distance_m: float | None
    checks: list[dict]


class TextEvidenceCreate(BaseModel):
    """Text-only evidence (witness statement, typed report) -- no file upload."""

    evidence_type: str = "WITNESS_STATEMENT"
    title: str
    text_content: str
    description: str | None = None
    occurred_at: str | None = None
    collected_at: str | None = None
    collection_lat: float | None = None
    collection_lon: float | None = None
    device_metadata: DeviceMetadataIn | None = None
    requires_two_person: bool | None = None


class SignatureOut(BaseModel):
    role: str
    officer_id: int
    officer_name: str | None
    badge_number: str | None
    signed_at: str
    signature: str
    valid: bool


class EvidenceOut(BaseModel):
    id: int
    uid: str
    case_id: int
    evidence_type: str
    title: str
    description: str | None
    text_content: str | None
    file_name: str | None
    file_size: int | None
    content_type: str | None
    content_hash: str
    occurred_at: str | None
    collected_at: str | None
    uploaded_at: str
    collection_lat: float | None
    collection_lon: float | None
    collecting_officer_id: int
    witnessing_officer_id: int | None
    status: str
    requires_two_person: bool
    confirmed_at: str | None
    rejection_reason: str | None
    was_offline: bool
    client_uuid: str | None
    recorded_at_device: str | None
    synced_at: str | None

    model_config = {"from_attributes": True}


class EvidenceDetail(EvidenceOut):
    signatures: list[SignatureOut]
    two_person_complete: bool
    device_metadata: DeviceMetadataOut | None
    ledger_entries: list[dict]
    integrity: dict


class ConfirmRequest(BaseModel):
    note: str | None = None


class RejectRequest(BaseModel):
    reason: str = Field(..., min_length=3)


# --- ledger ------------------------------------------------------------------


class LedgerEntryOut(BaseModel):
    seq: int
    event_type: str
    actor_id: int | None
    evidence_id: int | None
    payload: dict | str
    payload_hash: str
    prev_hash: str
    entry_hash: str
    created_at: str


class LedgerAppendRequest(BaseModel):
    """Used by Parts 2-4 to record AI flags and human decisions in the chain."""

    event_type: str
    payload: dict[str, Any]
    evidence_id: int | None = None


class VerifyReport(BaseModel):
    case_number: str
    entry_count: int
    chain_valid: bool
    files_valid: bool
    valid: bool
    head_hash: str
    witnessed_head: dict | None
    broken_at_seq: int | None
    errors: list[dict]
    file_integrity: dict | None
    verified_at: str


# --- audit -------------------------------------------------------------------


class AuditEntryOut(BaseModel):
    seq: int
    actor_id: int | None
    actor_role: str | None
    action: str
    resource_type: str
    resource_id: str | None
    case_id: int | None
    outcome: str
    detail: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: str
    entry_hash: str

    model_config = {"from_attributes": True}


# --- offline sync ------------------------------------------------------------


class OfflineRecord(BaseModel):
    client_uuid: str
    case_id: int | None = None
    case_number: str | None = None
    evidence_type: str = "OTHER"
    title: str | None = None
    description: str | None = None
    text_content: str | None = None
    file_base64: str | None = None
    file_name: str | None = None
    content_type: str | None = None
    content_hash_client: str | None = None
    occurred_at: str | None = None
    collected_at: str | None = None
    recorded_at_device: str | None = None
    collection_lat: float | None = None
    collection_lon: float | None = None
    collecting_officer_id: int | None = None
    collecting_officer_badge: str | None = None
    device_metadata: DeviceMetadataIn | None = None
    requires_two_person: bool | None = None
    offline_signature: str | None = None


class SyncBatchRequest(BaseModel):
    device_id: str | None = None
    records: list[OfflineRecord]

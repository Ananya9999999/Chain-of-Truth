"""Access audit trail -- every view, not just every edit.

The spec is explicit: "Audit trail on every access, not just every edit." So
this is written by GET handlers too, including denied attempts, and it is itself
hash-chained (one global chain) so an insider cannot quietly delete the record
of having looked at a case file.
"""
from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import GENESIS_HASH, HASH_ALGORITHM
from ..core.canonical import canonical_json, hash_payload, utc_now_iso
from ..core.locks import chain_lock
from ..models import AuditLogEntry, User

AUDIT_VERSION = "chain-of-truth/audit-v1"

OUTCOME_ALLOWED = "ALLOWED"
OUTCOME_DENIED = "DENIED"
OUTCOME_NOT_FOUND = "NOT_FOUND"
OUTCOME_REJECTED = "REJECTED"

# Written by the ledger on every append. It records the case chain's head, so a
# ledger whose tail has been chopped off can be caught: the audit log still
# remembers a higher sequence number than the ledger now contains.
ACTION_LEDGER_APPEND = "LEDGER_APPEND"


def compute_audit_hash(
    *,
    seq: int,
    actor_id: int | None,
    action: str,
    resource_type: str,
    resource_id: str | None,
    case_id: int | None,
    outcome: str,
    created_at: str,
    detail: str | None,
    prev_hash: str,
) -> str:
    return hash_payload(
        {
            "algorithm": HASH_ALGORITHM,
            "version": AUDIT_VERSION,
            "seq": seq,
            "actor_id": actor_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "case_id": case_id,
            "outcome": outcome,
            "created_at": created_at,
            "detail": detail,
            "prev_hash": prev_hash,
        }
    )


def record(
    db: Session,
    *,
    actor: User | None,
    action: str,
    resource_type: str,
    resource_id: str | int | None = None,
    case_id: int | None = None,
    outcome: str = OUTCOME_ALLOWED,
    detail: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLogEntry:
    """Append one audit link and commit it.

    Committed on its own session unit of work so that an access is recorded even
    if the surrounding business operation later fails -- an attempted read is
    still an access.
    """
    with chain_lock:
        entry = _build(
            db,
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            case_id=case_id,
            outcome=outcome,
            detail=detail,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.commit()
        db.refresh(entry)
        return entry


def _build(
    db: Session,
    *,
    actor: User | None,
    action: str,
    resource_type: str,
    resource_id: str | int | None,
    case_id: int | None,
    outcome: str,
    detail: str | None,
    ip_address: str | None,
    user_agent: str | None,
) -> AuditLogEntry:
    """Stage one audit link without committing. Caller must hold ``chain_lock``."""
    previous = db.execute(
        select(AuditLogEntry).order_by(AuditLogEntry.seq.desc()).limit(1)
    ).scalar_one_or_none()
    seq = 0 if previous is None else previous.seq + 1
    prev_hash = GENESIS_HASH if previous is None else previous.entry_hash
    created_at = utc_now_iso()
    resource_ref = None if resource_id is None else str(resource_id)

    entry_hash = compute_audit_hash(
        seq=seq,
        actor_id=actor.id if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_ref,
        case_id=case_id,
        outcome=outcome,
        created_at=created_at,
        detail=detail,
        prev_hash=prev_hash,
    )

    entry = AuditLogEntry(
        seq=seq,
        actor_id=actor.id if actor else None,
        actor_role=actor.role if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_ref,
        case_id=case_id,
        outcome=outcome,
        detail=detail,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=created_at,
        prev_hash=prev_hash,
        entry_hash=entry_hash,
    )
    db.add(entry)
    db.flush()
    return entry


def anchor_ledger_append(
    db: Session,
    *,
    actor_id: int | None,
    case_id: int,
    seq: int,
    event_type: str,
    entry_hash: str,
) -> AuditLogEntry:
    """Record a case chain's new head in the audit chain (cross-anchor).

    Staged, not committed: the ledger commits both rows together so a ledger
    entry and its anchor can never exist apart.
    """
    actor = db.get(User, actor_id) if actor_id else None
    return _build(
        db,
        actor=actor,
        action=ACTION_LEDGER_APPEND,
        resource_type="LEDGER",
        resource_id=str(seq),
        case_id=case_id,
        outcome=OUTCOME_ALLOWED,
        detail=canonical_json({"event_type": event_type, "entry_hash": entry_hash}),
        ip_address=None,
        user_agent=None,
    )


def latest_ledger_anchor(db: Session, case_id: int) -> dict | None:
    """The highest case chain head this audit log has ever witnessed."""
    row = db.execute(
        select(AuditLogEntry)
        .where(
            AuditLogEntry.action == ACTION_LEDGER_APPEND,
            AuditLogEntry.case_id == case_id,
        )
        .order_by(AuditLogEntry.seq.desc())
        .limit(1)
    ).scalar_one_or_none()
    if row is None:
        return None
    try:
        detail = json.loads(row.detail or "{}")
    except ValueError:
        detail = {}
    return {
        "seq": int(row.resource_id) if row.resource_id is not None else None,
        "entry_hash": detail.get("entry_hash"),
        "event_type": detail.get("event_type"),
        "witnessed_at": row.created_at,
        "audit_seq": row.seq,
    }


def head(db: Session) -> dict:
    """Current audit head -- record this externally to close the last gap.

    A hash chain cannot detect having its own tail chopped off; only something
    outside the database can. Exporting this head hash to a second system on a
    schedule is the production answer, and it is a one-line integration.
    """
    row = db.execute(
        select(AuditLogEntry).order_by(AuditLogEntry.seq.desc()).limit(1)
    ).scalar_one_or_none()
    return {
        "head_seq": row.seq if row else None,
        "head_hash": row.entry_hash if row else GENESIS_HASH,
        "entry_count": (row.seq + 1) if row else 0,
        "generated_at": utc_now_iso(),
    }


def verify_audit_chain(db: Session) -> dict:
    """Recompute the global audit chain and report any break."""
    entries = list(
        db.execute(select(AuditLogEntry).order_by(AuditLogEntry.seq.asc())).scalars()
    )
    errors: list[dict] = []
    expected_prev = GENESIS_HASH

    for index, entry in enumerate(entries):
        if entry.seq != index:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "SEQUENCE_GAP",
                    "detail": f"expected seq {index}, found {entry.seq} "
                    "(an audit record was deleted)",
                }
            )
        if entry.prev_hash != expected_prev:
            errors.append(
                {"seq": entry.seq, "error": "BROKEN_LINK", "detail": "prev_hash mismatch"}
            )
        recomputed = compute_audit_hash(
            seq=entry.seq,
            actor_id=entry.actor_id,
            action=entry.action,
            resource_type=entry.resource_type,
            resource_id=entry.resource_id,
            case_id=entry.case_id,
            outcome=entry.outcome,
            created_at=entry.created_at,
            detail=entry.detail,
            prev_hash=entry.prev_hash,
        )
        if recomputed != entry.entry_hash:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "ENTRY_HASH_MISMATCH",
                    "detail": "an audit record was edited after it was written",
                }
            )
        expected_prev = entry.entry_hash

    return {
        "entry_count": len(entries),
        "valid": not errors,
        "head_hash": entries[-1].entry_hash if entries else GENESIS_HASH,
        "broken_at_seq": min((e["seq"] for e in errors), default=None),
        "errors": errors,
        "verified_at": utc_now_iso(),
    }

"""The tamper-proof hash chain.

Every case owns one append-only chain of ledger entries:

    seq 0  CASE_OPENED         prev_hash = 000...0 (genesis)
    seq 1  EVIDENCE_UPLOADED   prev_hash = entry_hash(seq 0)
    seq 2  EVIDENCE_CONFIRMED  prev_hash = entry_hash(seq 1)
    ...

Because each link commits to the previous link's digest, editing any historical
row invalidates that row's own hash *and* every link after it. Verification is a
single left-to-right recomputation -- there is no trusted flag to flip.

This module is deliberately AI-free: it is cryptography, and it needs to be
deterministic and provably reliable rather than probabilistic.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import GENESIS_HASH, HASH_ALGORITHM
from ..core.canonical import (
    canonical_json,
    hash_payload,
    sha256_file,
    sha256_hex,
    utc_now_iso,
)
from ..core.locks import chain_lock
from ..models import Case, Evidence, LedgerEntry
from . import audit

LEDGER_VERSION = "chain-of-truth/ledger-v1"

# Events written by Part 1 itself.
EVENT_CASE_OPENED = "CASE_OPENED"
EVENT_EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
EVENT_EVIDENCE_UPLOADED_OFFLINE = "EVIDENCE_UPLOADED_OFFLINE_SYNC"
EVENT_DEVICE_METADATA_LOCKED = "DEVICE_METADATA_LOCKED"
EVENT_EVIDENCE_CONFIRMED = "EVIDENCE_CONFIRMED"
EVENT_EVIDENCE_REJECTED = "EVIDENCE_REJECTED"
EVENT_EVIDENCE_ACCESSED = "EVIDENCE_FILE_ACCESSED"

# Events other teams append through POST /cases/{id}/ledger/append so their
# human-gate decisions land in the same tamper-evident record.
EXTERNAL_EVENT_TYPES = {
    "AI_EXTRACTION_RECORDED",      # Part 2
    "AI_FLAG_RAISED",              # Part 2
    "AI_FLAG_CONFIRMED",           # Part 2 / Part 4 human gate
    "AI_FLAG_DISMISSED",
    "TIMELINE_ENTRY_VERIFIED",     # Part 4
    "GUIDANCE_ISSUED",             # Part 3
    "AUTOPSY_HYPOTHESIS_LOGGED",   # Part 3
    "CHARGESHEET_QA_RUN",          # Part 3
    "CASE_NOTE",
}


def compute_entry_hash(
    *,
    seq: int,
    case_number: str,
    event_type: str,
    actor_id: int | None,
    created_at: str,
    payload_hash: str,
    prev_hash: str,
) -> str:
    """The single definition of a link digest. Used to write *and* to verify."""
    return hash_payload(
        {
            "algorithm": HASH_ALGORITHM,
            "version": LEDGER_VERSION,
            "seq": seq,
            "case_number": case_number,
            "event_type": event_type,
            "actor_id": actor_id,
            "created_at": created_at,
            "payload_hash": payload_hash,
            "prev_hash": prev_hash,
        }
    )


def head(db: Session, case_id: int) -> LedgerEntry | None:
    return db.execute(
        select(LedgerEntry)
        .where(LedgerEntry.case_id == case_id)
        .order_by(LedgerEntry.seq.desc())
        .limit(1)
    ).scalar_one_or_none()


def append_entry(
    db: Session,
    *,
    case: Case,
    event_type: str,
    payload: dict,
    actor_id: int | None = None,
    evidence_id: int | None = None,
) -> LedgerEntry:
    """Append one link and COMMIT the session.

    The commit happens inside the chain lock so that sequence allocation and
    the insert are atomic. Callers should therefore stage all related rows
    (evidence, signatures, device metadata) *before* calling this -- they are
    committed together with the ledger entry, which is what makes "the evidence
    row and its hash-chain link always exist together" true.
    """
    with chain_lock:
        previous = head(db, case.id)
        seq = 0 if previous is None else previous.seq + 1
        prev_hash = GENESIS_HASH if previous is None else previous.entry_hash

        created_at = utc_now_iso()
        payload_json = canonical_json(payload)
        payload_hash = hash_payload(payload)
        entry_hash = compute_entry_hash(
            seq=seq,
            case_number=case.case_number,
            event_type=event_type,
            actor_id=actor_id,
            created_at=created_at,
            payload_hash=payload_hash,
            prev_hash=prev_hash,
        )

        entry = LedgerEntry(
            case_id=case.id,
            seq=seq,
            event_type=event_type,
            actor_id=actor_id,
            evidence_id=evidence_id,
            payload=payload_json,
            payload_hash=payload_hash,
            prev_hash=prev_hash,
            entry_hash=entry_hash,
            created_at=created_at,
        )
        db.add(entry)
        db.flush()
        # Cross-anchor: the audit chain witnesses this new head, so lopping the
        # tail off the ledger later leaves the audit log remembering a
        # sequence number the ledger no longer has.
        audit.anchor_ledger_append(
            db,
            actor_id=actor_id,
            case_id=case.id,
            seq=seq,
            event_type=event_type,
            entry_hash=entry_hash,
        )
        db.commit()
        db.refresh(entry)
        return entry


def verify_case_chain(db: Session, case: Case, *, check_files: bool = True) -> dict:
    """Recompute the whole chain from genesis and report the first break.

    Returns a report dict rather than raising, because "show me the chain is
    intact" is a screen in the demo, not an exception path.
    """
    entries = list(
        db.execute(
            select(LedgerEntry)
            .where(LedgerEntry.case_id == case.id)
            .order_by(LedgerEntry.seq.asc())
        ).scalars()
    )

    errors: list[dict] = []
    expected_prev = GENESIS_HASH

    for index, entry in enumerate(entries):
        if entry.seq != index:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "SEQUENCE_GAP",
                    "detail": f"expected seq {index}, found {entry.seq}",
                }
            )
        if entry.prev_hash != expected_prev:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "BROKEN_LINK",
                    "detail": "prev_hash does not match the previous entry hash",
                    "expected": expected_prev,
                    "found": entry.prev_hash,
                }
            )
        recomputed_payload_hash = hash_payload(_safe_load(entry.payload))
        if recomputed_payload_hash != entry.payload_hash:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "PAYLOAD_ALTERED",
                    "detail": "stored payload does not hash to the recorded payload_hash",
                    "expected": entry.payload_hash,
                    "found": recomputed_payload_hash,
                }
            )
        recomputed_entry_hash = compute_entry_hash(
            seq=entry.seq,
            case_number=case.case_number,
            event_type=entry.event_type,
            actor_id=entry.actor_id,
            created_at=entry.created_at,
            payload_hash=entry.payload_hash,
            prev_hash=entry.prev_hash,
        )
        if recomputed_entry_hash != entry.entry_hash:
            errors.append(
                {
                    "seq": entry.seq,
                    "error": "ENTRY_HASH_MISMATCH",
                    "detail": "entry fields were altered after it was written",
                    "expected": entry.entry_hash,
                    "found": recomputed_entry_hash,
                }
            )
        expected_prev = entry.entry_hash

    # Tail truncation: a chain cannot detect its own end being chopped off, so
    # ask the audit chain what head it last witnessed for this case.
    anchor = audit.latest_ledger_anchor(db, case.id)
    if anchor and anchor["seq"] is not None:
        if not entries or entries[-1].seq < anchor["seq"]:
            errors.append(
                {
                    "seq": anchor["seq"],
                    "error": "CHAIN_TRUNCATED",
                    "detail": (
                        f"the audit log witnessed this chain at seq {anchor['seq']} "
                        f"({anchor['witnessed_at']}), but it now ends at seq "
                        f"{entries[-1].seq if entries else 'none'} -- entries were removed"
                    ),
                    "expected": anchor["entry_hash"],
                    "found": entries[-1].entry_hash if entries else None,
                }
            )
        elif (
            entries[-1].seq == anchor["seq"]
            and entries[-1].entry_hash != anchor["entry_hash"]
        ):
            errors.append(
                {
                    "seq": anchor["seq"],
                    "error": "HEAD_HASH_MISMATCH",
                    "detail": "the head no longer matches the hash the audit log witnessed",
                    "expected": anchor["entry_hash"],
                    "found": entries[-1].entry_hash,
                }
            )

    content_report = _verify_evidence_content(db, case) if check_files else None

    broken_at = min((e["seq"] for e in errors), default=None)
    files_ok = content_report is None or content_report["failed"] == 0
    return {
        "case_number": case.case_number,
        "entry_count": len(entries),
        "chain_valid": not errors,
        "files_valid": files_ok,
        "valid": not errors and files_ok,
        "head_hash": entries[-1].entry_hash if entries else GENESIS_HASH,
        "witnessed_head": anchor,
        "broken_at_seq": broken_at,
        "errors": errors,
        "file_integrity": content_report,
        "verified_at": utc_now_iso(),
    }


def recompute_content_hash(item: Evidence) -> tuple[str | None, str | None]:
    """Re-derive an evidence item's digest from what is stored right now.

    Returns (hash, error_code). Covers both kinds of evidence: bytes on disk for
    file-backed items, and the exact UTF-8 bytes of ``text_content`` for
    text-only items such as witness statements. Text evidence carries no file,
    so skipping it here would leave a statement editable in the database without
    verification noticing -- exactly the thing this system exists to prevent.
    """
    if item.storage_path:
        try:
            return sha256_file(item.storage_path), None
        except OSError:
            return None, "FILE_MISSING"
    if item.text_content is not None:
        return sha256_hex(item.text_content.encode("utf-8")), None
    return None, "NO_CONTENT"


def _verify_evidence_content(db: Session, case: Case) -> dict:
    """Re-hash every evidence item against the digest the chain committed to.

    The chain proves the *record* was not edited. This proves the *content*
    behind the record -- file bytes or statement text -- is still the same.
    """
    evidence_items = list(
        db.execute(select(Evidence).where(Evidence.case_id == case.id)).scalars()
    )
    failures: list[dict] = []
    checked = 0
    for item in evidence_items:
        actual, error = recompute_content_hash(item)
        if error == "NO_CONTENT":
            continue
        checked += 1
        kind = "FILE" if item.storage_path else "TEXT"
        if error:
            failures.append(
                {
                    "evidence_uid": item.uid,
                    "error": error,
                    "detail": f"stored content for {item.uid} could not be read",
                }
            )
            continue
        if actual != item.content_hash:
            failures.append(
                {
                    "evidence_uid": item.uid,
                    "error": f"{kind}_ALTERED",
                    "expected": item.content_hash,
                    "found": actual,
                }
            )
    return {"checked": checked, "failed": len(failures), "failures": failures}


def chain_stats(db: Session, case_id: int) -> dict:
    count = db.execute(
        select(func.count(LedgerEntry.id)).where(LedgerEntry.case_id == case_id)
    ).scalar_one()
    tip = head(db, case_id)
    return {
        "entry_count": count,
        "head_hash": tip.entry_hash if tip else GENESIS_HASH,
        "head_seq": tip.seq if tip else None,
    }


def _safe_load(raw: str):
    import json

    try:
        return json.loads(raw)
    except ValueError:
        # A payload that is no longer valid JSON is itself evidence of tampering;
        # return the raw string so the hash comparison fails loudly.
        return raw

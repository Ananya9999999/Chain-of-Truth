"""Deterministic serialisation + time helpers.

Every hash in this system is taken over a *canonical* JSON encoding so that the
same logical payload always produces the same digest, on any machine, in any
Python version. Key order, separators and encoding are all pinned.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


def utc_now_iso() -> str:
    """Current UTC time as a fixed-width ISO-8601 string (hashable, sortable)."""
    return datetime.now(timezone.utc).strftime(ISO_FORMAT)


def to_iso(value: datetime | str | None) -> str | None:
    """Normalise a datetime (or already-ISO string) to the canonical format."""
    if value is None:
        return None
    if isinstance(value, str):
        return to_iso(parse_iso(value))
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime(ISO_FORMAT)


def parse_iso(value: str) -> datetime:
    """Parse an ISO-8601 timestamp, tolerating a trailing 'Z' and no micros."""
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def canonical_json(payload: Any) -> str:
    """Stable JSON: sorted keys, no incidental whitespace, UTF-8 safe."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def canonical_bytes(payload: Any) -> bytes:
    return canonical_json(payload).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def hash_payload(payload: Any) -> str:
    """SHA-256 over the canonical encoding of a JSON-serialisable payload."""
    return sha256_hex(canonical_bytes(payload))


def sha256_file(path: str, chunk_size: int = 1024 * 1024) -> str:
    """Stream a file from disk into SHA-256 (evidence files can be large)."""
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()

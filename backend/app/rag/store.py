"""Vector storage and retrieval over pgvector, with a portable fallback.

On PostgreSQL the `embedding_vec` column (added by the migration) is a real
pgvector column with an HNSW index, and similarity search runs in the database.
On SQLite -- used by the test suite and by anyone who has not started Docker --
the same JSON embeddings are scored in Python. Identical results, different
execution site; `describe()` reports which one is live so nobody has to guess.

Retrieval is always case-scoped. Evidence from one case must never surface as
context for another, and that is enforced here rather than left to callers.
"""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select, text as sql_text
from sqlalchemy.orm import Session

from ..ai.embeddings import cosine, get_embedder
from ..core.canonical import utc_now_iso
from ..models_features import EvidenceChunk, KbChunk
from .chunking import chunk_text, detect_language


@dataclass
class Retrieved:
    """A retrieved passage plus everything needed to cite it."""

    chunk_id: int
    content: str
    score: float
    evidence_id: int | None = None
    offset_start: int | None = None
    offset_end: int | None = None
    kb_ref: str | None = None
    kb_title: str | None = None
    language: str = "en"

    def as_citation(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "evidence_id": self.evidence_id,
            "excerpt": self.content[:400],
            "offset_start": self.offset_start,
            "offset_end": self.offset_end,
            "kb_ref": self.kb_ref,
            "kb_title": self.kb_title,
            "score": round(self.score, 4),
        }


def _is_postgres(db: Session) -> bool:
    return db.bind is not None and db.bind.dialect.name == "postgresql"


def _pgvector_available(db: Session) -> bool:
    """True only if we are on Postgres AND the vector column really exists."""
    if not _is_postgres(db):
        return False
    try:
        row = db.execute(
            sql_text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name = 'evidence_chunks' AND column_name = 'embedding_vec'"
            )
        ).first()
        return row is not None
    except Exception:
        return False


def describe(db: Session) -> dict[str, Any]:
    embedder = get_embedder()
    return {
        "backend": "pgvector" if _pgvector_available(db) else "python-cosine",
        "dialect": db.bind.dialect.name if db.bind is not None else "unknown",
        "embedding": embedder.describe(),
    }


# --- indexing ----------------------------------------------------------------
def index_evidence(
    db: Session, *, case_id: int, evidence_id: int, content: str
) -> list[EvidenceChunk]:
    """Chunk, embed and store one evidence item. Idempotent per evidence item."""
    if not content or not content.strip():
        return []

    db.query(EvidenceChunk).filter(EvidenceChunk.evidence_id == evidence_id).delete()

    chunks = chunk_text(content)
    if not chunks:
        return []

    embedder = get_embedder()
    vectors = embedder.embed([c.content for c in chunks])
    now = utc_now_iso()
    rows: list[EvidenceChunk] = []

    for chunk, vector in zip(chunks, vectors):
        row = EvidenceChunk(
            uid=str(uuid.uuid4()),
            case_id=case_id,
            evidence_id=evidence_id,
            chunk_index=chunk.index,
            content=chunk.content,
            offset_start=chunk.offset_start,
            offset_end=chunk.offset_end,
            language=detect_language(chunk.content),
            token_estimate=chunk.token_estimate,
            embedding=json.dumps(vector),
            embedding_model=embedder.name,
            created_at=now,
        )
        db.add(row)
        rows.append(row)

    db.flush()
    if _pgvector_available(db):
        _sync_pgvector(db, "evidence_chunks", [(r.id, r.embedding) for r in rows])
    return rows


def index_kb_entry(db: Session, entry: dict[str, Any]) -> KbChunk | None:
    """Index one curated legal/procedural rule.

    The guidance agent retrieves only from this table, never from case text --
    that separation is what stops "procedural guidance" turning into the model
    quoting a witness back at the officer as if it were law.
    """
    kb_id = entry.get("id")
    if not kb_id:
        return None

    existing = db.execute(
        select(KbChunk).where(KbChunk.kb_id == kb_id)
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    body = " ".join(
        str(entry.get(k, "")) for k in ("section", "title", "text") if entry.get(k)
    )
    embedder = get_embedder()
    row = KbChunk(
        uid=str(uuid.uuid4()),
        kb_id=kb_id,
        section=entry.get("section", ""),
        title=entry.get("title", ""),
        category=entry.get("category", "procedure"),
        content=entry.get("text", ""),
        triggers=json.dumps(entry.get("triggers", [])),
        checklist=json.dumps(entry.get("checklist", [])),
        source_citation=entry.get("section"),
        embedding=json.dumps(embedder.embed_one(body)),
        embedding_model=embedder.name,
        created_at=utc_now_iso(),
    )
    db.add(row)
    db.flush()
    if _pgvector_available(db):
        _sync_pgvector(db, "kb_chunks", [(row.id, row.embedding)])
    return row


def _sync_pgvector(db: Session, table: str, pairs: list[tuple[int, str | None]]) -> None:
    """Mirror JSON embeddings into the native pgvector column."""
    for row_id, payload in pairs:
        if not payload:
            continue
        db.execute(
            sql_text(f"UPDATE {table} SET embedding_vec = :vec WHERE id = :id"),
            {"vec": payload, "id": row_id},
        )


# --- retrieval ---------------------------------------------------------------
def retrieve_case_context(
    db: Session, *, case_id: int, query: str, top_k: int = 6,
    exclude_evidence_id: int | None = None,
) -> list[Retrieved]:
    """Top-k passages from THIS case only."""
    embedder = get_embedder()
    qvec = embedder.embed_one(query)

    if _pgvector_available(db):
        sql = (
            "SELECT id, evidence_id, content, offset_start, offset_end, language, "
            "       1 - (embedding_vec <=> CAST(:qvec AS vector)) AS score "
            "FROM evidence_chunks "
            "WHERE case_id = :case_id AND embedding_vec IS NOT NULL "
            + ("AND evidence_id <> :excl " if exclude_evidence_id else "")
            + "ORDER BY embedding_vec <=> CAST(:qvec AS vector) LIMIT :k"
        )
        params: dict[str, Any] = {
            "qvec": json.dumps(qvec),
            "case_id": case_id,
            "k": top_k,
        }
        if exclude_evidence_id:
            params["excl"] = exclude_evidence_id
        rows = db.execute(sql_text(sql), params).mappings().all()
        return [
            Retrieved(
                chunk_id=r["id"],
                content=r["content"],
                score=float(r["score"]),
                evidence_id=r["evidence_id"],
                offset_start=r["offset_start"],
                offset_end=r["offset_end"],
                language=r["language"],
            )
            for r in rows
        ]

    stmt = select(EvidenceChunk).where(EvidenceChunk.case_id == case_id)
    if exclude_evidence_id:
        stmt = stmt.where(EvidenceChunk.evidence_id != exclude_evidence_id)

    scored: list[Retrieved] = []
    for row in db.execute(stmt).scalars():
        if not row.embedding:
            continue
        scored.append(
            Retrieved(
                chunk_id=row.id,
                content=row.content,
                score=cosine(qvec, json.loads(row.embedding)),
                evidence_id=row.evidence_id,
                offset_start=row.offset_start,
                offset_end=row.offset_end,
                language=row.language,
            )
        )
    scored.sort(key=lambda r: r.score, reverse=True)
    return scored[:top_k]


def retrieve_kb(db: Session, *, query: str, top_k: int = 5) -> list[Retrieved]:
    """Top-k curated legal rules for a query."""
    embedder = get_embedder()
    qvec = embedder.embed_one(query)
    lowered = (query or "").lower()

    scored: list[Retrieved] = []
    for row in db.execute(select(KbChunk)).scalars():
        if not row.embedding:
            continue
        score = cosine(qvec, json.loads(row.embedding))
        # Curated trigger words are a strong, explicit signal from a human
        # editor; let them outrank fuzzy vector similarity.
        try:
            triggers = json.loads(row.triggers or "[]")
        except (ValueError, TypeError):
            triggers = []
        if any(t and t.lower() in lowered for t in triggers):
            score += 0.35
        scored.append(
            Retrieved(
                chunk_id=row.id,
                content=row.content,
                score=score,
                kb_ref=row.section,
                kb_title=row.title,
            )
        )
    scored.sort(key=lambda r: r.score, reverse=True)
    return scored[:top_k]


def build_context(passages: list[Retrieved], *, max_chars: int = 6000) -> str:
    """Assemble retrieved passages into a bounded, citation-tagged block."""
    parts: list[str] = []
    used = 0
    for i, p in enumerate(passages, start=1):
        tag = p.kb_ref or (f"evidence#{p.evidence_id}" if p.evidence_id else "source")
        block = f"[{i}] ({tag}) {p.content.strip()}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
    return "\n\n".join(parts)

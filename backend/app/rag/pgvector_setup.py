"""Create the native pgvector columns and indexes on PostgreSQL.

The ORM models store embeddings as JSON text so the same schema runs on SQLite
(tests, offline dev) and PostgreSQL. That portability is worth keeping, but on
PostgreSQL it means pgvector would sit installed and unused unless something
adds a real `vector` column alongside — which is exactly what happened until
this module existed: `store.py` looked for `embedding_vec`, never found it, and
silently fell back to scoring every row in Python.

This runs at startup, is idempotent, and is a no-op on SQLite. It is written as
plain DDL rather than an Alembic revision because it must also work for anyone
who bootstraps with `Base.metadata.create_all` instead of running migrations.
"""
from __future__ import annotations

import logging
import os

from sqlalchemy import Engine, text

log = logging.getLogger(__name__)

# Tables carrying embeddings, and the column that holds the JSON copy.
_VECTOR_TABLES = ("evidence_chunks", "kb_chunks")


def _dim() -> int:
    try:
        return int(os.getenv("COT_EMBEDDING_DIM", "384"))
    except ValueError:
        return 384


def ensure_pgvector(engine: Engine) -> dict[str, str]:
    """Add `embedding_vec` + an HNSW index to each embedding table.

    Returns a per-table status map for logging and diagnostics. Never raises:
    a missing extension or an insufficient-privilege error degrades to the
    Python cosine path rather than taking the API down.
    """
    status: dict[str, str] = {}
    if engine.dialect.name != "postgresql":
        return {t: "skipped (not postgresql)" for t in _VECTOR_TABLES}

    dim = _dim()

    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            for table in _VECTOR_TABLES:
                exists = conn.execute(
                    text(
                        "SELECT 1 FROM information_schema.tables "
                        "WHERE table_schema = 'public' AND table_name = :t"
                    ),
                    {"t": table},
                ).first()
                if exists is None:
                    status[table] = "table not created yet"
                    continue

                conn.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ADD COLUMN IF NOT EXISTS embedding_vec vector({dim})"
                    )
                )

                # HNSW with cosine distance, matching the `<=>` operator used by
                # the retrieval queries. Built after the column so a fresh
                # database gets both in one pass.
                conn.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_{table}_embedding_hnsw "
                        f"ON {table} USING hnsw (embedding_vec vector_cosine_ops)"
                    )
                )
                status[table] = f"ready (vector({dim}) + hnsw)"

        log.info("pgvector ready: %s", status)
    except Exception as exc:  # pragma: no cover - environment dependent
        # Falling back is correct here: retrieval still works in Python, just
        # slower. Taking the whole API down over an index would be worse.
        log.warning(
            "pgvector setup skipped (%s); retrieval will score in Python instead",
            exc,
        )
        return {t: f"unavailable: {exc}" for t in _VECTOR_TABLES}

    return status


def backfill_vectors(engine: Engine) -> int:
    """Copy existing JSON embeddings into the native vector column.

    Needed for rows written before the column existed, or written while running
    on SQLite and later migrated. Returns the number of rows updated.
    """
    if engine.dialect.name != "postgresql":
        return 0

    updated = 0
    try:
        with engine.begin() as conn:
            for table in _VECTOR_TABLES:
                result = conn.execute(
                    text(
                        f"UPDATE {table} "
                        f"SET embedding_vec = CAST(embedding AS vector) "
                        f"WHERE embedding IS NOT NULL AND embedding_vec IS NULL"
                    )
                )
                updated += result.rowcount or 0
    except Exception as exc:  # pragma: no cover - environment dependent
        log.warning("pgvector backfill skipped: %s", exc)
        return 0

    if updated:
        log.info("pgvector backfill: %d row(s)", updated)
    return updated

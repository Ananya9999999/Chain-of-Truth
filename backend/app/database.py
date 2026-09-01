"""SQLAlchemy engine / session wiring."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, _record):  # pragma: no cover - driver glue
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        # If a writer outside this process holds the lock (a seed script, a
        # second worker), wait rather than failing the request outright.
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from . import models, models_analysis, models_features  # noqa: F401  (registers mappers)

    Base.metadata.create_all(bind=engine)

    # On PostgreSQL, add the native pgvector columns and HNSW indexes alongside
    # the portable JSON embeddings, then backfill anything written earlier.
    # No-op on SQLite. Imported here rather than at module scope to keep the
    # import graph acyclic (rag -> models -> database).
    from .rag.pgvector_setup import backfill_vectors, ensure_pgvector

    ensure_pgvector(engine)
    backfill_vectors(engine)

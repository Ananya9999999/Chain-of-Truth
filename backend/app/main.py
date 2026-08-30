"""Chain of Truth -- Part 1: Backend & Tamper-Proof Ledger.

Scope owned by this service:
  * evidence upload API (file + text)
  * SHA-256 hash chain over every case event
  * two-person confirmation flow, enforced with Ed25519 signatures
  * locked capture-device metadata + officer shift cross-check
  * audit trail on every view/access, itself hash-chained
  * offline-first sync

Not in this service (other teams own these): AI extraction and RAG, the
contradiction detector, legal guidance agents, the frontend, and role-based
access enforcement. The integration seams for all of them are documented in
backend/README.md.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes_audit, routes_cases, routes_evidence, routes_ledger, routes_sync, routes_users
from .config import GENESIS_HASH, HASH_ALGORITHM
from .core.canonical import utc_now_iso
from .database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Chain of Truth -- Evidence Integrity Backend",
    version="1.0.0",
    description=(
        "Tamper-proof evidence ledger for the Chain of Truth investigation "
        "system. Cryptography, not AI: hashing is deterministic and provably "
        "reliable, which is exactly why the integrity layer does not use a model."
    ),
)

# The demo frontend (Part 4) runs on a different origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
for module in (
    routes_users,
    routes_cases,
    routes_evidence,
    routes_ledger,
    routes_audit,
    routes_sync,
):
    app.include_router(module.router, prefix=API_PREFIX)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "chain-of-truth-backend",
        "hash_algorithm": HASH_ALGORITHM,
        "genesis_hash": GENESIS_HASH,
        "time": utc_now_iso(),
    }

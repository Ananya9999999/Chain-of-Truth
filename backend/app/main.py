<<<<<<< HEAD
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
=======
"""Chain of Truth — Evidence Integrity Backend + AI Agents.

Part 1: Tamper-proof ledger (hash chain, two-person confirmation, audit, offline sync)
Part 3: Guidance / Autopsy / Chargesheet agents (AI assists, humans decide)
Part 5: RBAC helpers available via api.deps_rbac
>>>>>>> origin/main
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

<<<<<<< HEAD
from .api import routes_audit, routes_cases, routes_evidence, routes_ledger, routes_sync, routes_users
=======
from .api import (
    routes_audit,
    routes_cases,
    routes_evidence,
    routes_ledger,
    routes_sync,
    routes_users,
    routes_agents,
)
from .api.routes_agents import legal_kb_payload
>>>>>>> origin/main
from .config import GENESIS_HASH, HASH_ALGORITHM
from .core.canonical import utc_now_iso
from .database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    lifespan=lifespan,
<<<<<<< HEAD
    title="Chain of Truth -- Evidence Integrity Backend",
    version="1.0.0",
    description=(
        "Tamper-proof evidence ledger for the Chain of Truth investigation "
        "system. Cryptography, not AI: hashing is deterministic and provably "
        "reliable, which is exactly why the integrity layer does not use a model."
    ),
)

# The demo frontend (Part 4) runs on a different origin.
=======
    title="Chain of Truth",
    version="1.1.0",
    description=(
        "Tamper-proof evidence ledger and AI investigation assistants. "
        "Cryptography for integrity; AI for suggestions only. "
        "AI assists, humans decide."
    ),
)

>>>>>>> origin/main
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
<<<<<<< HEAD
=======
    routes_agents,
>>>>>>> origin/main
):
    app.include_router(module.router, prefix=API_PREFIX)


<<<<<<< HEAD
=======
@app.get("/api/v1/legal-kb", tags=["agents-part3"])
def legal_kb() -> dict:
    """Transparency: curated BNS/CrPC knowledge base used by the Guidance Agent."""
    return legal_kb_payload()


>>>>>>> origin/main
@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "chain-of-truth-backend",
        "hash_algorithm": HASH_ALGORITHM,
        "genesis_hash": GENESIS_HASH,
        "time": utc_now_iso(),
<<<<<<< HEAD
=======
        "agents": ["guidance", "autopsy", "chargesheet_qa", "full_analysis"],
>>>>>>> origin/main
    }

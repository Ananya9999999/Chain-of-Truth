"""Chain of Truth — Evidence Integrity Backend + AI Agents.

Part 1: Tamper-proof ledger (hash chain, two-person confirmation, audit, offline sync)
Part 3: Guidance / Autopsy / Chargesheet agents (AI assists, humans decide)
Part 5: RBAC helpers available via api.deps_rbac
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import (
    routes_audit,
    routes_cases,
    routes_evidence,
    routes_ledger,
    routes_sync,
    routes_users,
    routes_agents,
    routes_analysis,
    routes_features,
)
from .api.routes_agents import legal_kb_payload
from .config import GENESIS_HASH, HASH_ALGORITHM
from .core.canonical import utc_now_iso
from .database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Chain of Truth",
    version="1.1.0",
    description=(
        "Tamper-proof evidence ledger and AI investigation assistants. "
        "Cryptography for integrity; AI for suggestions only. "
        "AI assists, humans decide."
    ),
)

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
    routes_agents,
    routes_analysis,
    routes_features,
):
    app.include_router(module.router, prefix=API_PREFIX)


@app.get("/api/v1/legal-kb", tags=["agents-part3"])
def legal_kb() -> dict:
    """Transparency: curated BNS/CrPC knowledge base used by the Guidance Agent."""
    return legal_kb_payload()


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "chain-of-truth-backend",
        "hash_algorithm": HASH_ALGORITHM,
        "genesis_hash": GENESIS_HASH,
        "time": utc_now_iso(),
        "agents": ["guidance", "autopsy", "chargesheet_qa", "full_analysis"],
    }

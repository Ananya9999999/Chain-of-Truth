"""Test fixtures.

Environment variables are set before the app package is imported so each run
gets a throwaway database and storage directory.
"""
from __future__ import annotations

import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="cot-test-")
os.environ["COT_DATABASE_URL"] = f"sqlite:///{_TMP}/test.db"
os.environ["COT_STORAGE_DIR"] = f"{_TMP}/storage"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    Base.metadata.drop_all(bind=engine)
    init_db()
    return TestClient(app)


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def officers(client: TestClient) -> dict:
    """Two officers: the collector and an independent witness."""
    collector = client.post(
        "/api/v1/officers",
        json={"badge_number": "KA-1001", "full_name": "Insp. Anita Rao"},
    ).json()
    witness = client.post(
        "/api/v1/officers",
        json={
            "badge_number": "KA-1002",
            "full_name": "SI Bhaskar N",
            "role": "SUPERVISOR",
        },
    ).json()
    return {
        "collector": collector,
        "witness": witness,
        "h_collector": {"X-Officer-Id": str(collector["id"])},
        "h_witness": {"X-Officer-Id": str(witness["id"])},
    }


@pytest.fixture()
def case(client: TestClient, officers: dict) -> dict:
    return client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "CR-2026-0001", "title": "Test case"},
    ).json()


@pytest.fixture()
def statement(client: TestClient, officers: dict, case: dict) -> dict:
    """One pending witness statement to work with."""
    return client.post(
        f"/api/v1/cases/{case['id']}/evidence/text",
        headers=officers["h_collector"],
        json={
            "evidence_type": "WITNESS_STATEMENT",
            "title": "Statement of R. Kumar",
            "text_content": "The suspect left the shop at about 9 PM.",
            "occurred_at": "2026-08-29T21:00:00Z",
        },
    ).json()

"""The hooks Parts 2-5 build on. These are contracts, so they are tested."""
from __future__ import annotations


def test_other_teams_can_append_ai_events_to_the_chain(client, officers, case, statement):
    """Part 2 records a contradiction flag; Part 4 records the officer's answer."""
    flag = client.post(
        f"/api/v1/cases/{case['id']}/ledger/append",
        headers=officers["h_collector"],
        json={
            "event_type": "AI_FLAG_RAISED",
            "evidence_id": statement["id"],
            "payload": {
                "flag_type": "TIME_CONTRADICTION",
                "severity": "MAJOR",
                "confidence": 0.82,
                "explanation": "statement says 9 PM; CCTV metadata says 21:47",
                "sources": [statement["uid"]],
            },
        },
    )
    assert flag.status_code == 201
    assert flag.json()["event_type"] == "AI_FLAG_RAISED"

    decision = client.post(
        f"/api/v1/cases/{case['id']}/ledger/append",
        headers=officers["h_witness"],
        json={
            "event_type": "AI_FLAG_CONFIRMED",
            "payload": {"flag_seq": flag.json()["seq"], "officer_note": "real discrepancy"},
        },
    )
    assert decision.status_code == 201
    assert decision.json()["prev_hash"] == flag.json()["entry_hash"]

    report = client.get(
        f"/api/v1/cases/{case['id']}/ledger/verify", headers=officers["h_collector"]
    ).json()
    assert report["valid"] is True


def test_evidence_lifecycle_events_cannot_be_forged_through_the_hook(client, officers, case):
    """Nobody can fake an EVIDENCE_CONFIRMED entry via the generic append route."""
    response = client.post(
        f"/api/v1/cases/{case['id']}/ledger/append",
        headers=officers["h_collector"],
        json={"event_type": "EVIDENCE_CONFIRMED", "payload": {"evidence_uid": "fake"}},
    )
    assert response.status_code == 422


def test_append_rejects_evidence_from_another_case(client, officers, case, statement):
    other = client.post(
        "/api/v1/cases",
        headers=officers["h_collector"],
        json={"case_number": "CR-2026-0002", "title": "Unrelated"},
    ).json()
    response = client.post(
        f"/api/v1/cases/{other['id']}/ledger/append",
        headers=officers["h_collector"],
        json={
            "event_type": "AI_FLAG_RAISED",
            "evidence_id": statement["id"],
            "payload": {},
        },
    )
    assert response.status_code == 404


def test_text_content_is_exposed_for_the_extraction_pipeline(client, officers, case, statement):
    """Part 2 reads text_content directly instead of re-downloading files."""
    items = client.get(
        f"/api/v1/cases/{case['id']}/evidence", headers=officers["h_collector"]
    ).json()
    assert items[0]["text_content"].startswith("The suspect left the shop")
    assert items[0]["occurred_at"] is not None


def test_ledger_supports_incremental_polling(client, officers, case, statement):
    """Part 4's live view polls with since_seq instead of refetching the chain."""
    new_entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger",
        headers=officers["h_collector"],
        params={"since_seq": 0},
    ).json()
    assert all(e["seq"] > 0 for e in new_entries)


def test_case_detail_exposes_chain_head_and_counts(client, officers, case, statement):
    detail = client.get(f"/api/v1/cases/{case['id']}", headers=officers["h_collector"]).json()
    assert detail["ledger"]["entry_count"] >= 2
    assert len(detail["ledger"]["head_hash"]) == 64
    assert detail["evidence_counts"]["PENDING_CONFIRMATION"] == 1


def test_every_actor_is_identified_and_carries_a_role(client, officers, statement):
    """Part 5 layers permission tiers on the role already recorded here."""
    entries = client.get("/api/v1/audit", headers=officers["h_collector"]).json()
    assert all(e["actor_id"] is not None for e in entries)
    assert {e["actor_role"] for e in entries} <= {"INVESTIGATING_OFFICER", "SUPERVISOR"}


def test_health_endpoint_states_the_algorithm(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["hash_algorithm"] == "sha256"

"""Audit trail: every view/access, not just every edit."""
from __future__ import annotations

from sqlalchemy import text


def _actions(client, headers, **params):
    entries = client.get("/api/v1/audit", headers=headers, params=params).json()
    return [e["action"] for e in entries]


def test_viewing_evidence_is_logged(client, officers, statement):
    client.get(f"/api/v1/evidence/{statement['uid']}", headers=officers["h_witness"])
    entries = client.get("/api/v1/audit", headers=officers["h_collector"]).json()
    view = next(e for e in entries if e["action"] == "VIEW_EVIDENCE")
    assert view["actor_id"] == officers["witness"]["id"]
    assert view["resource_id"] == statement["uid"]
    assert view["outcome"] == "ALLOWED"


def test_listing_and_case_reads_are_logged(client, officers, case):
    client.get(f"/api/v1/cases/{case['id']}", headers=officers["h_witness"])
    client.get(f"/api/v1/cases/{case['id']}/evidence", headers=officers["h_witness"])
    actions = _actions(client, officers["h_collector"])
    assert "VIEW_CASE" in actions
    assert "LIST_EVIDENCE" in actions


def test_downloading_a_file_is_logged_and_chained(client, officers, case):
    import io

    upload = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("report.txt", io.BytesIO(b"forensic report"), "text/plain")},
        data={"evidence_type": "FORENSIC_REPORT", "title": "Lab report"},
    ).json()

    response = client.get(
        f"/api/v1/evidence/{upload['uid']}/file", headers=officers["h_witness"]
    )
    assert response.status_code == 200
    assert response.content == b"forensic report"

    assert "DOWNLOAD_EVIDENCE" in _actions(client, officers["h_collector"])
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    accessed = [e for e in entries if e["event_type"] == "EVIDENCE_FILE_ACCESSED"]
    assert accessed and accessed[0]["payload"]["accessed_by"]["id"] == officers["witness"]["id"]


def test_failed_lookups_are_logged_too(client, officers):
    client.get("/api/v1/evidence/does-not-exist", headers=officers["h_witness"])
    entries = client.get("/api/v1/audit", headers=officers["h_collector"]).json()
    miss = next(e for e in entries if e["resource_id"] == "does-not-exist")
    assert miss["outcome"] == "NOT_FOUND"


def test_denied_confirmation_attempt_is_logged(client, officers, statement):
    client.post(
        f"/api/v1/evidence/{statement['uid']}/confirm",
        headers=officers["h_collector"],
        json={},
    )
    entries = client.get("/api/v1/audit", headers=officers["h_witness"]).json()
    denied = next(
        e for e in entries if e["action"] == "CONFIRM_EVIDENCE" and e["outcome"] == "DENIED"
    )
    assert "SAME_OFFICER" in denied["detail"]


def test_reading_the_audit_log_is_itself_audited(client, officers):
    client.get("/api/v1/audit", headers=officers["h_witness"])
    assert "VIEW_AUDIT_LOG" in _actions(client, officers["h_collector"])


def test_audit_log_is_hash_chained(client, officers, statement):
    report = client.get("/api/v1/audit/verify", headers=officers["h_collector"]).json()
    assert report["valid"] is True
    assert report["entry_count"] > 0


def test_deleting_an_audit_record_is_detected(client, officers, statement, db):
    client.get(f"/api/v1/evidence/{statement['uid']}", headers=officers["h_witness"])
    client.get("/api/v1/audit", headers=officers["h_collector"])  # a later access
    db.execute(text("DELETE FROM audit_log WHERE action='VIEW_EVIDENCE'"))
    db.commit()
    report = client.get("/api/v1/audit/verify", headers=officers["h_collector"]).json()
    assert report["valid"] is False
    assert any(e["error"] in {"SEQUENCE_GAP", "BROKEN_LINK"} for e in report["errors"])


def test_editing_an_audit_record_is_detected(client, officers, statement, db):
    client.get(f"/api/v1/evidence/{statement['uid']}", headers=officers["h_witness"])
    db.execute(
        text("UPDATE audit_log SET actor_id=:a WHERE action='VIEW_EVIDENCE'"),
        {"a": officers["collector"]["id"]},
    )
    db.commit()
    report = client.get("/api/v1/audit/verify", headers=officers["h_collector"]).json()
    assert report["valid"] is False
    assert any(e["error"] == "ENTRY_HASH_MISMATCH" for e in report["errors"])


def test_audit_can_be_filtered_by_case_and_actor(client, officers, case, statement):
    client.get(f"/api/v1/cases/{case['id']}", headers=officers["h_witness"])
    by_actor = client.get(
        "/api/v1/audit",
        headers=officers["h_collector"],
        params={"actor_id": officers["witness"]["id"]},
    ).json()
    assert by_actor
    assert {e["actor_id"] for e in by_actor} == {officers["witness"]["id"]}


def test_requests_without_an_officer_header_are_rejected(client, case):
    assert client.get(f"/api/v1/cases/{case['id']}").status_code == 401


def test_ledger_appends_are_anchored_in_the_audit_chain(client, officers, case, statement):
    """Cross-anchor: the audit log witnesses every new ledger head."""
    anchors = client.get(
        "/api/v1/audit",
        headers=officers["h_collector"],
        params={"action": "LEDGER_APPEND", "case_id": case["id"]},
    ).json()
    assert len(anchors) >= 2
    assert all(a["resource_type"] == "LEDGER" for a in anchors)


def test_audit_head_can_be_exported_for_external_anchoring(client, officers, statement):
    anchor = client.get("/api/v1/audit/anchor", headers=officers["h_collector"]).json()
    assert len(anchor["head_hash"]) == 64
    assert anchor["entry_count"] == anchor["head_seq"] + 1

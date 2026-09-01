"""Locked device metadata and the officer shift cross-check."""
from __future__ import annotations

import io
import json

import pytest

MG_ROAD = (12.9716, 77.5946)
FAR_AWAY = (19.0760, 72.8777)  # ~840 km away


@pytest.fixture()
def shift(client, officers):
    return client.post(
        f"/api/v1/officers/{officers['collector']['id']}/shifts",
        headers=officers["h_collector"],
        json={
            "started_at": "2026-08-29T18:00:00Z",
            "ended_at": "2026-08-30T06:00:00Z",
            "lat": MG_ROAD[0],
            "lon": MG_ROAD[1],
            "radius_m": 2000,
            "location_label": "MG Road PS",
        },
    ).json()


def _upload_photo(client, officers, case, metadata):
    return client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("scene.jpg", io.BytesIO(b"jpeg-bytes"), "image/jpeg")},
        data={
            "evidence_type": "PHOTO",
            "title": "Scene photo",
            "device_metadata": json.dumps(metadata),
        },
    )


def test_photo_without_device_metadata_is_refused(client, officers, case):
    response = client.post(
        f"/api/v1/cases/{case['id']}/evidence",
        headers=officers["h_collector"],
        files={"file": ("scene.jpg", io.BytesIO(b"jpeg-bytes"), "image/jpeg")},
        data={"evidence_type": "PHOTO", "title": "Scene photo"},
    )
    assert response.status_code == 422
    assert "device metadata" in response.json()["detail"]


def test_metadata_matching_the_shift_is_consistent(client, officers, case, shift):
    result = _upload_photo(
        client,
        officers,
        case,
        {
            "device_id": "PIXEL-7-KA1001",
            "capture_timestamp": "2026-08-29T21:47:00Z",
            "gps_lat": MG_ROAD[0],
            "gps_lon": MG_ROAD[1],
        },
    ).json()
    metadata = result["device_metadata"]
    assert metadata["cross_check_result"] == "CONSISTENT"
    assert metadata["cross_check_distance_m"] < 10
    assert metadata["metadata_hash"]
    assert metadata["locked_at"]


def test_capture_far_from_the_logged_shift_is_flagged(client, officers, case, shift):
    result = _upload_photo(
        client,
        officers,
        case,
        {
            "device_id": "PIXEL-7-KA1001",
            "capture_timestamp": "2026-08-29T21:47:00Z",
            "gps_lat": FAR_AWAY[0],
            "gps_lon": FAR_AWAY[1],
        },
    ).json()
    metadata = result["device_metadata"]
    assert metadata["cross_check_result"] == "FLAGGED"
    assert metadata["cross_check_distance_m"] > 500_000
    failed = [c for c in metadata["checks"] if c["status"] == "FAIL"]
    assert failed[0]["check"] == "SHIFT_LOCATION_MATCH"


def test_capture_timestamp_after_upload_is_flagged(client, officers, case, shift):
    result = _upload_photo(
        client,
        officers,
        case,
        {
            "device_id": "PIXEL-7-KA1001",
            "capture_timestamp": "2099-01-01T00:00:00Z",
            "gps_lat": MG_ROAD[0],
            "gps_lon": MG_ROAD[1],
        },
    ).json()
    checks = {c["check"]: c for c in result["device_metadata"]["checks"]}
    assert checks["CAPTURE_BEFORE_UPLOAD"]["status"] == "FAIL"
    assert result["device_metadata"]["cross_check_result"] == "FLAGGED"


def test_no_shift_data_is_reported_honestly(client, officers, case):
    """No roster on file is 'we cannot tell', not 'this is fine'."""
    result = _upload_photo(
        client,
        officers,
        case,
        {
            "device_id": "PIXEL-7-KA1001",
            "capture_timestamp": "2026-08-29T21:47:00Z",
            "gps_lat": MG_ROAD[0],
            "gps_lon": MG_ROAD[1],
        },
    ).json()
    metadata = result["device_metadata"]
    assert metadata["cross_check_result"] == "INSUFFICIENT_DATA"
    checks = {c["check"]: c for c in metadata["checks"]}
    assert checks["SHIFT_LOCATION_MATCH"]["status"] == "NO_SHIFT_DATA"


def test_metadata_hash_is_committed_to_the_chain(client, officers, case, shift):
    result = _upload_photo(
        client,
        officers,
        case,
        {
            "device_id": "PIXEL-7-KA1001",
            "capture_timestamp": "2026-08-29T21:47:00Z",
            "gps_lat": MG_ROAD[0],
            "gps_lon": MG_ROAD[1],
        },
    ).json()
    entries = client.get(
        f"/api/v1/cases/{case['id']}/ledger", headers=officers["h_collector"]
    ).json()
    upload_entry = next(
        e for e in entries if e["payload"].get("evidence_uid") == result["uid"]
    )
    assert (
        upload_entry["payload"]["device_metadata"]["metadata_hash"]
        == result["device_metadata"]["metadata_hash"]
    )


def test_there_is_no_route_to_edit_locked_metadata(client):
    """Locked means locked: nothing in the API can rewrite it."""
    paths = client.get("/openapi.json").json()["paths"]
    assert not [p for p in paths if "device" in p.lower() and "metadata" in p.lower()]

"""Locked capture-device metadata + shift cross-check.

The hash chain only proves a file was not altered *after* upload. It says
nothing about someone uploading a photo taken somewhere else, at another time.
The spec's fix for that: capture and lock device metadata (GPS, device id,
capture timestamp) at the moment of upload, and cross-check it against the
officer's logged location for that shift.

This does not make fraud impossible. It raises the bar from "one person can fake
this alone" to "several independent signals would have to be falsified
together" -- and every mismatch is surfaced, never silently swallowed.
"""
from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import CAPTURE_CLOCK_SKEW_TOLERANCE_S, SHIFT_LOCATION_TOLERANCE_M
from ..core.canonical import canonical_json, hash_payload, parse_iso, to_iso, utc_now_iso
from ..models import DeviceMetadata, Evidence, OfficerShift

RESULT_CONSISTENT = "CONSISTENT"
RESULT_FLAGGED = "FLAGGED"
RESULT_INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

EARTH_RADIUS_M = 6371008.8


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _find_shift(db: Session, officer_id: int, at_iso: str) -> OfficerShift | None:
    """The officer's rostered shift covering a given instant, if any."""
    shifts = list(
        db.execute(select(OfficerShift).where(OfficerShift.officer_id == officer_id)).scalars()
    )
    moment = parse_iso(at_iso)
    for shift in shifts:
        if parse_iso(shift.started_at) <= moment <= parse_iso(shift.ended_at):
            return shift
    return None


def cross_check(
    db: Session,
    *,
    officer_id: int,
    capture_timestamp: str | None,
    gps_lat: float | None,
    gps_lon: float | None,
    uploaded_at: str,
) -> tuple[str, list[dict], float | None]:
    """Run every independent check. Returns (result, checks, distance_m)."""
    checks: list[dict] = []
    distance_m: float | None = None

    # 1. Capture timestamp sanity -- a capture cannot postdate its own upload.
    if capture_timestamp is None:
        checks.append(
            {
                "check": "CAPTURE_TIMESTAMP_PRESENT",
                "status": "MISSING",
                "detail": "device did not supply a capture timestamp",
            }
        )
    else:
        captured = parse_iso(capture_timestamp)
        uploaded = parse_iso(uploaded_at)
        skew = (captured - uploaded).total_seconds()
        if skew > CAPTURE_CLOCK_SKEW_TOLERANCE_S:
            checks.append(
                {
                    "check": "CAPTURE_BEFORE_UPLOAD",
                    "status": "FAIL",
                    "detail": (
                        f"capture timestamp is {int(skew)}s after upload time -- "
                        "device clock is wrong or the metadata was edited"
                    ),
                }
            )
        else:
            checks.append(
                {
                    "check": "CAPTURE_BEFORE_UPLOAD",
                    "status": "PASS",
                    "detail": f"captured {int(-skew)}s before upload",
                }
            )

    # 2. GPS presence.
    if gps_lat is None or gps_lon is None:
        checks.append(
            {
                "check": "CAPTURE_GPS_PRESENT",
                "status": "MISSING",
                "detail": "device did not supply GPS coordinates",
            }
        )
    else:
        checks.append({"check": "CAPTURE_GPS_PRESENT", "status": "PASS", "detail": None})

    # 3. Capture location vs the officer's logged shift location.
    if capture_timestamp is None or gps_lat is None or gps_lon is None:
        checks.append(
            {
                "check": "SHIFT_LOCATION_MATCH",
                "status": "SKIPPED",
                "detail": "needs both capture GPS and capture timestamp",
            }
        )
    else:
        shift = _find_shift(db, officer_id, capture_timestamp)
        if shift is None:
            checks.append(
                {
                    "check": "SHIFT_LOCATION_MATCH",
                    "status": "NO_SHIFT_DATA",
                    "detail": "no logged shift covers the capture timestamp",
                }
            )
        else:
            distance_m = haversine_m(gps_lat, gps_lon, shift.lat, shift.lon)
            allowed = max(shift.radius_m or 0.0, SHIFT_LOCATION_TOLERANCE_M)
            if distance_m <= allowed:
                checks.append(
                    {
                        "check": "SHIFT_LOCATION_MATCH",
                        "status": "PASS",
                        "detail": (
                            f"{distance_m:.0f}m from logged shift location "
                            f"({shift.location_label or 'unlabelled'}), within {allowed:.0f}m"
                        ),
                    }
                )
            else:
                checks.append(
                    {
                        "check": "SHIFT_LOCATION_MATCH",
                        "status": "FAIL",
                        "detail": (
                            f"{distance_m:.0f}m from the officer's logged shift location "
                            f"({shift.location_label or 'unlabelled'}), tolerance {allowed:.0f}m"
                        ),
                    }
                )

    statuses = {c["status"] for c in checks}
    if "FAIL" in statuses:
        result = RESULT_FLAGGED
    elif statuses <= {"PASS"}:
        result = RESULT_CONSISTENT
    else:
        result = RESULT_INSUFFICIENT_DATA
    return result, checks, distance_m


def lock_metadata(
    db: Session, *, evidence: Evidence, raw: dict | None
) -> DeviceMetadata:
    """Write the one-and-only device metadata row for an evidence item.

    There is no update path for this table -- the values are frozen at upload
    and the hash of them goes into the ledger entry, so a later edit to the
    stored metadata breaks the chain.
    """
    raw = raw or {}
    capture_timestamp = to_iso(raw.get("capture_timestamp")) if raw.get("capture_timestamp") else None
    gps_lat = _as_float(raw.get("gps_lat"))
    gps_lon = _as_float(raw.get("gps_lon"))

    result, checks, distance_m = cross_check(
        db,
        officer_id=evidence.collecting_officer_id,
        capture_timestamp=capture_timestamp,
        gps_lat=gps_lat,
        gps_lon=gps_lon,
        uploaded_at=evidence.uploaded_at,
    )

    normalised = {
        "device_id": raw.get("device_id"),
        "device_model": raw.get("device_model"),
        "capture_timestamp": capture_timestamp,
        "gps_lat": gps_lat,
        "gps_lon": gps_lon,
        "gps_accuracy_m": _as_float(raw.get("gps_accuracy_m")),
        "extra": {k: v for k, v in raw.items() if k not in _KNOWN_KEYS},
    }

    row = DeviceMetadata(
        evidence_id=evidence.id,
        device_id=normalised["device_id"],
        device_model=normalised["device_model"],
        capture_timestamp=capture_timestamp,
        gps_lat=gps_lat,
        gps_lon=gps_lon,
        gps_accuracy_m=normalised["gps_accuracy_m"],
        raw_metadata=canonical_json(normalised),
        metadata_hash=hash_payload(normalised),
        locked_at=utc_now_iso(),
        cross_check_result=result,
        cross_check_detail=canonical_json(checks),
        cross_check_distance_m=distance_m,
    )
    db.add(row)
    db.flush()
    return row


_KNOWN_KEYS = {
    "device_id",
    "device_model",
    "capture_timestamp",
    "gps_lat",
    "gps_lon",
    "gps_accuracy_m",
}


def _as_float(value) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

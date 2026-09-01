"""Runtime configuration for the Chain of Truth backend (Part 1)."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Storage -----------------------------------------------------------------
STORAGE_DIR = Path(os.getenv("COT_STORAGE_DIR", BASE_DIR / "storage"))
DATABASE_URL = os.getenv("COT_DATABASE_URL", f"sqlite:///{BASE_DIR / 'chain_of_truth.db'}")

# --- Hash chain --------------------------------------------------------------
GENESIS_HASH = "0" * 64
HASH_ALGORITHM = "sha256"

# --- Two-person confirmation rule --------------------------------------------
# The spec makes two-person logging mandatory for *physical* evidence: the
# collecting officer plus one witnessing officer / evidence custodian.
PHYSICAL_EVIDENCE_TYPES = {
    "SEIZED_ITEM",
    "WEAPON",
    "PHYSICAL_SAMPLE",
    "BIOLOGICAL_SAMPLE",
    "PHYSICAL_DOCUMENT",
    "AUTOPSY_REPORT",
    "FORENSIC_REPORT",
}

# Digital capture types must carry locked device metadata (GPS / device id /
# capture timestamp) so upload time can be cross-checked against capture time.
DEVICE_METADATA_REQUIRED_TYPES = {
    "PHOTO",
    "VIDEO",
    "CCTV_FOOTAGE",
    "AUDIO_RECORDING",
}

# --- Device metadata cross-check ---------------------------------------------
# How far a capture GPS point may sit from the officer's logged shift location
# before the upload is flagged for review.
SHIFT_LOCATION_TOLERANCE_M = float(os.getenv("COT_SHIFT_TOLERANCE_M", "2000"))

# Capture timestamp further in the future than this is impossible -> flagged.
CAPTURE_CLOCK_SKEW_TOLERANCE_S = 300

MAX_UPLOAD_BYTES = int(os.getenv("COT_MAX_UPLOAD_BYTES", str(200 * 1024 * 1024)))

STORAGE_DIR.mkdir(parents=True, exist_ok=True)

"""Runtime configuration for the Chain of Truth backend."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent


def load_dotenv(path: Path | None = None, *, override: bool = False) -> dict[str, str]:
    """Read the repo-root `.env` into the process environment.

    Without this the backend silently ignored `.env` entirely: `os.getenv` fell
    through to the SQLite default no matter what `COT_DATABASE_URL` said, and
    `GROQ_API_KEY` was never seen. A config file that looks authoritative but is
    not read is worse than no config file at all.

    Deliberately stdlib rather than `python-dotenv` -- it is ~20 lines and keeps
    the backend installable without another dependency.

    Real environment variables win by default, so `docker run -e` and CI secrets
    still override the file.
    """
    env_path = path or (REPO_ROOT / ".env")
    loaded: dict[str, str] = {}
    if not env_path.exists():
        return loaded

    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        # Strip one matching pair of surrounding quotes, and any trailing
        # comment on an unquoted value.
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if not key:
            continue
        loaded[key] = value
        if override or key not in os.environ:
            os.environ[key] = value
    return loaded


# Must run before any os.getenv below.
load_dotenv()

# --- Storage -----------------------------------------------------------------
STORAGE_DIR = Path(os.getenv("COT_STORAGE_DIR", BASE_DIR / "storage"))

# Falls back to SQLite so a fresh clone runs with no Docker at all. Point
# COT_DATABASE_URL at PostgreSQL in .env for the full stack (pgvector-backed
# retrieval only engages on PostgreSQL).
DATABASE_URL = os.getenv(
    "COT_DATABASE_URL", f"sqlite:///{BASE_DIR / 'chain_of_truth.db'}"
)


def database_backend() -> str:
    """Human-readable name of the database actually in use."""
    return "postgresql" if DATABASE_URL.startswith("postgresql") else "sqlite"

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

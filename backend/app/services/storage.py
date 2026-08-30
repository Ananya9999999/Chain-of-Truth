"""Evidence file storage.

Files are written under storage/<case_number>/<evidence_uid>__<filename> and
hashed while streaming, so a large upload is only read once.
"""
from __future__ import annotations

import hashlib
import re
import shutil
from pathlib import Path
from typing import BinaryIO

from ..config import MAX_UPLOAD_BYTES, STORAGE_DIR

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


class UploadTooLarge(Exception):
    pass


def safe_filename(name: str) -> str:
    cleaned = _SAFE_NAME.sub("_", Path(name).name).strip("._") or "evidence.bin"
    return cleaned[:180]


def case_dir(case_number: str) -> Path:
    directory = STORAGE_DIR / safe_filename(case_number)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def store_stream(
    stream: BinaryIO, *, case_number: str, evidence_uid: str, file_name: str
) -> tuple[str, str, int]:
    """Persist an uploaded stream. Returns (storage_path, sha256_hex, size)."""
    destination = case_dir(case_number) / f"{evidence_uid}__{safe_filename(file_name)}"
    digest = hashlib.sha256()
    size = 0
    with open(destination, "wb") as handle:
        while True:
            chunk = stream.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                handle.close()
                destination.unlink(missing_ok=True)
                raise UploadTooLarge(f"upload exceeds {MAX_UPLOAD_BYTES} bytes")
            digest.update(chunk)
            handle.write(chunk)
    return str(destination), digest.hexdigest(), size


def store_bytes(
    data: bytes, *, case_number: str, evidence_uid: str, file_name: str
) -> tuple[str, str, int]:
    destination = case_dir(case_number) / f"{evidence_uid}__{safe_filename(file_name)}"
    destination.write_bytes(data)
    return str(destination), hashlib.sha256(data).hexdigest(), len(data)


def purge_case_files(case_number: str) -> None:
    """Test helper -- never wired to an API route."""
    shutil.rmtree(case_dir(case_number), ignore_errors=True)

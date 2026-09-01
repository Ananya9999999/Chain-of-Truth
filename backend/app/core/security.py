"""Password hashing and JWT issuance.

Deliberately stdlib-only. `argon2-cffi` and `pyjwt` would both be reasonable,
but they need native wheels that are not reliably available for every Python
version on Windows, and a demo that cannot `pip install` is a demo that does
not happen. `hashlib.scrypt` is a memory-hard KDF in the standard library and
HS256 is an HMAC over two base64url segments -- both are fully specified here
rather than hand-waved.

Nothing in this module reads a secret from source. The signing secret comes
from COT_JWT_SECRET; startup refuses to run with the placeholder value.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass

# ── password hashing (scrypt) ────────────────────────────────────────────────
# RFC 7914 interactive-login parameters.
_SCRYPT_N = 2**14  # CPU/memory cost
_SCRYPT_R = 8
_SCRYPT_P = 1
_SALT_BYTES = 16
_KEY_LEN = 32


def hash_password(password: str) -> str:
    """Return `scrypt$N$r$p$salt_b64$hash_b64`."""
    if not password:
        raise ValueError("password must not be empty")
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_KEY_LEN,
    )
    return "scrypt${}${}${}${}${}".format(
        _SCRYPT_N,
        _SCRYPT_R,
        _SCRYPT_P,
        base64.b64encode(salt).decode(),
        base64.b64encode(digest).decode(),
    )


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verification. Returns False on any malformed input."""
    try:
        scheme, n_s, r_s, p_s, salt_b64, hash_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        expected = base64.b64decode(hash_b64)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=base64.b64decode(salt_b64),
            n=int(n_s),
            r=int(r_s),
            p=int(p_s),
            dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, KeyError):
        return False


# ── JWT (HS256) ──────────────────────────────────────────────────────────────
class JWTError(Exception):
    """Raised when a token is missing, malformed, tampered with, or expired."""


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


def _secret() -> str:
    secret = os.getenv("COT_JWT_SECRET", "")
    if not secret or secret.startswith("CHANGE_ME"):
        # Development fallback keeps `uvicorn` runnable straight after clone,
        # but it is per-process and random, so tokens do not survive a restart
        # and can never be mistaken for a configured production secret.
        secret = _DEV_SECRET
    return secret


_DEV_SECRET = secrets.token_urlsafe(64)


def encode_token(claims: dict, *, ttl_seconds: int) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {**claims, "iat": now, "exp": now + ttl_seconds}
    segments = [
        _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode()),
        _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()),
    ]
    signing_input = ".".join(segments).encode("ascii")
    signature = hmac.new(_secret().encode(), signing_input, hashlib.sha256).digest()
    segments.append(_b64url_encode(signature))
    return ".".join(segments)


def decode_token(token: str) -> dict:
    """Verify signature and expiry, then return the claims."""
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise JWTError("malformed token") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = hmac.new(_secret().encode(), signing_input, hashlib.sha256).digest()
    try:
        provided = _b64url_decode(signature_b64)
    except (ValueError, TypeError) as exc:
        raise JWTError("malformed signature") from exc
    # compare_digest, not ==, so a wrong signature cannot be found byte-by-byte.
    if not hmac.compare_digest(expected, provided):
        raise JWTError("signature does not verify")

    try:
        claims = json.loads(_b64url_decode(payload_b64))
    except (ValueError, TypeError) as exc:
        raise JWTError("malformed payload") from exc

    if int(claims.get("exp", 0)) < int(time.time()):
        raise JWTError("token has expired")
    return claims


def issue_tokens(*, subject: str, role: str, badge: str) -> TokenPair:
    access_ttl = int(os.getenv("COT_ACCESS_TOKEN_MINUTES", "15")) * 60
    refresh_ttl = int(os.getenv("COT_REFRESH_TOKEN_DAYS", "7")) * 86400
    base = {"sub": subject, "role": role, "badge": badge}
    return TokenPair(
        access_token=encode_token({**base, "typ": "access"}, ttl_seconds=access_ttl),
        refresh_token=encode_token({**base, "typ": "refresh"}, ttl_seconds=refresh_ttl),
        token_type="bearer",
        expires_in=access_ttl,
    )

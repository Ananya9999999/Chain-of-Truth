"""Ed25519 signatures for the two-person confirmation flow.

Each officer gets a keypair at registration. A confirmation is only accepted if
the officer's key produces a valid signature over the exact evidence digest, so
the two-person rule is enforced cryptographically rather than by a boolean
column that anyone with DB access could flip.

DEMO SIMPLIFICATION (state this openly to judges): private keys are generated
and held server-side. A production deployment would keep the private key in the
officer's device keystore / smart card and only ever send the signature to the
server. Nothing else about the scheme changes -- verification code is identical.
"""
from __future__ import annotations

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from .canonical import canonical_bytes


def generate_keypair() -> tuple[str, str]:
    """Return (private_key_hex, public_key_hex) for a newly registered officer."""
    private_key = Ed25519PrivateKey.generate()
    private_hex = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    ).hex()
    public_hex = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    ).hex()
    return private_hex, public_hex


def sign_payload(private_key_hex: str, payload: dict) -> str:
    key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key_hex))
    return key.sign(canonical_bytes(payload)).hex()


def verify_payload(public_key_hex: str, payload: dict, signature_hex: str) -> bool:
    try:
        key = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        key.verify(bytes.fromhex(signature_hex), canonical_bytes(payload))
        return True
    except (InvalidSignature, ValueError):
        return False


def attestation_payload(
    *,
    evidence_uid: str,
    content_hash: str,
    role: str,
    officer_id: int,
    signed_at: str,
) -> dict:
    """The exact object an officer signs when attesting to an evidence item.

    Binding the role and officer id into the signed payload means a collecting
    officer's signature cannot be replayed as the witnessing signature.
    """
    return {
        "attestation": "chain-of-truth/evidence-v1",
        "content_hash": content_hash,
        "evidence_uid": evidence_uid,
        "officer_id": officer_id,
        "role": role,
        "signed_at": signed_at,
    }


def offline_record_payload(
    *,
    client_uuid: str,
    content_hash: str,
    recorded_at_device: str,
    officer_id: int,
) -> dict:
    """What a field device signs when it logs evidence with no connectivity.

    Signing on the device at capture time is what lets the server accept an
    original timestamp it did not witness: the record was sealed before it
    could reach us.
    """
    return {
        "attestation": "chain-of-truth/offline-record-v1",
        "client_uuid": client_uuid,
        "content_hash": content_hash,
        "officer_id": officer_id,
        "recorded_at_device": recorded_at_device,
    }

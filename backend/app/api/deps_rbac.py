"""Part 5 — Role-based access control helpers.

Builds on Part 1's deps.get_current_user. Roles are already stored on User;
this module enforces permission tiers.

Roles (from models.ROLES):
  INVESTIGATING_OFFICER  — collect evidence, confirm/dismiss AI flags
  SUPERVISOR             — all officer actions + case oversight
  FORENSIC_REVIEWER      — autopsy hypothesis review, forensic evidence
  LEGAL_REVIEWER         — chargesheet QA sign-off, guidance review

Usage in a route:
  user: User = Depends(require_roles("LEGAL_REVIEWER", "SUPERVISOR"))
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status

from ..models import User
from .deps import get_current_user

# Permission matrix (what each role may do)
ROLE_PERMISSIONS: dict[str, set[str]] = {
    "INVESTIGATING_OFFICER": {
        "evidence:upload",
        "evidence:view",
        "timeline:view",
        "timeline:verify",
        "contradiction:resolve",
        "guidance:view",
        "guidance:ack",
        "analysis:run",
        "chain:verify",
    },
    "SUPERVISOR": {
        "evidence:upload",
        "evidence:view",
        "evidence:confirm",
        "timeline:view",
        "timeline:verify",
        "contradiction:resolve",
        "guidance:view",
        "guidance:ack",
        "analysis:run",
        "autopsy:view",
        "chargesheet:qa",
        "chain:verify",
        "audit:view",
        "case:manage",
    },
    "FORENSIC_REVIEWER": {
        "evidence:view",
        "timeline:view",
        "guidance:view",
        "analysis:run",
        "autopsy:view",
        "autopsy:signoff",
        "chain:verify",
    },
    "LEGAL_REVIEWER": {
        "evidence:view",
        "timeline:view",
        "guidance:view",
        "contradiction:view",
        "analysis:run",
        "chargesheet:qa",
        "chargesheet:signoff",
        "chain:verify",
        "audit:view",
    },
}


def require_roles(*allowed: str):
    """Dependency factory: user must have one of the listed roles."""

    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"role '{user.role}' not permitted; requires one of {list(allowed)}",
            )
        return user

    return _check


def require_permission(permission: str):
    """Dependency factory: user role must include the given permission."""

    def _check(user: User = Depends(get_current_user)) -> User:
        perms = ROLE_PERMISSIONS.get(user.role, set())
        if permission not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"role '{user.role}' lacks permission '{permission}'",
            )
        return user

    return _check


def user_permissions(user: User) -> list[str]:
    return sorted(ROLE_PERMISSIONS.get(user.role, set()))

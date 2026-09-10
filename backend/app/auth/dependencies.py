"""FastAPI auth dependencies."""

from __future__ import annotations

from typing import Any

from fastapi import Depends, Header

from app.auth.jwt_handler import decode_token
from app.models.user import get_user
from app.utils.errors import ForbiddenError, UnauthorizedError


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing or malformed Authorization header.")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    user = get_user(payload.get("sub", ""))
    if user is None:
        raise UnauthorizedError("Account no longer exists.")
    return user


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Chainable dependency: resolve current user, then enforce admin role."""
    if current_user.get("role") != "admin":
        raise ForbiddenError("Admin privileges are required for this operation.")
    return current_user
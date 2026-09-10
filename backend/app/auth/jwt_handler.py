"""JWT handling.

Tokens carry only: sub (user id), email, name, role, exp. Created and verified
with python-jose HS256 using the configured JWT secret. No sensitive data is
ever placed in a token.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import settings
from app.utils.errors import UnauthorizedError


def create_access_token(user: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["_id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role", "user"),
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise UnauthorizedError("Invalid or expired token. Please sign in again.") from exc
"""User service: find/create users and convert to API-safe output."""

from __future__ import annotations

from typing import Any

from app.models.user import find_or_create_user


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["_id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
    }


def login_via_google(
    email: str,
    name: str,
    google_provider_id: str,
    role: str = "user",
) -> dict[str, Any]:
    return find_or_create_user(
        email=email,
        name=name,
        google_provider_id=google_provider_id,
        role=role,
    )

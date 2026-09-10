"""User model: Mongo document shape and helpers.

User document:
    {
        "_id": str,
        "name": str,
        "email": str,
        "google_provider_id": str | None,
        "role": "user" | "admin",
        "created_at": ISO-8601 str,
    }
No passwords or other sensitive material are ever stored.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.database import USERS_COLLECTION, get_store


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_user(
    email: str,
    name: str,
    google_provider_id: str | None = None,
    role: str = "user",
) -> dict[str, Any]:
    import uuid

    return {
        "_id": uuid.uuid4().hex,
        "name": name,
        "email": email.lower(),
        "google_provider_id": google_provider_id,
        "role": role,
        "created_at": iso_now(),
    }


def find_or_create_user(
    email: str,
    name: str,
    google_provider_id: str | None = None,
    role: str = "user",
) -> dict[str, Any]:
    """Find by provider id or email; create when missing. Idempotent login."""
    store = get_store()
    user = store.find_one(USERS_COLLECTION, {"google_provider_id": google_provider_id}) if google_provider_id else None
    if user is None:
        user = store.find_one(USERS_COLLECTION, {"email": email.lower()})
    if user is None:
        user = new_user(email, name, google_provider_id, role)
        store.insert_one(USERS_COLLECTION, user)
        logger = __import__("app.utils.logging", fromlist=["get_logger"]).get_logger(__name__)
        logger.info("Created user %s (%s)", user["_id"][:8], user["email"])
    elif google_provider_id and not user.get("google_provider_id"):
        store.update_one(
            USERS_COLLECTION,
            {"_id": user["_id"]},
            {"$set": {"google_provider_id": google_provider_id}},
        )
        user["google_provider_id"] = google_provider_id
    return user


def get_user(user_id: str) -> dict[str, Any] | None:
    return get_store().find_one(USERS_COLLECTION, {"_id": user_id})
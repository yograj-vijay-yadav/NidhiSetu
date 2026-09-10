"""Application controller."""

from __future__ import annotations

from typing import Any

from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationDocumentsUpdate,
    ApplicationStatusUpdate,
)
from app.services import application_service


def handle_create(user: dict[str, Any], request: ApplicationCreateRequest) -> dict[str, Any]:
    doc = application_service.create_application(user["_id"], request.analysis)
    return _strip_user(doc)


def handle_list(user: dict[str, Any]) -> list[dict[str, Any]]:
    return [_strip_user(a) for a in application_service.list_applications(user["_id"])]


def handle_get(user: dict[str, Any], application_id: str) -> dict[str, Any]:
    return _strip_user(application_service.get_application(user["_id"], application_id))


def handle_update_status(
    user: dict[str, Any],
    application_id: str,
    request: ApplicationStatusUpdate,
) -> dict[str, Any]:
    doc = application_service.update_status(user["_id"], application_id, request.status, request.note)
    return _strip_user(doc)


def handle_update_documents(
    user: dict[str, Any],
    application_id: str,
    request: ApplicationDocumentsUpdate,
) -> dict[str, Any]:
    doc = application_service.update_documents(user["_id"], application_id, request.documents)
    return _strip_user(doc)


def _strip_user(app: dict[str, Any]) -> dict[str, Any]:
    app = dict(app)
    if "_id" in app:
        app["id"] = app.pop("_id")
    app.pop("user_id", None)
    return app
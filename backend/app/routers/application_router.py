"""Application endpoints (auth required; users only see their own)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.controllers import application_controller
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationDocumentsUpdate,
    ApplicationStatusUpdate,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post(
    "",
    response_model=None,
    summary="Save an analysis as an application",
    description="Persists the /api/analyze result with status 'analysis_completed'.",
    responses={201: {"description": "Application created"}},
)
def create_application(request: ApplicationCreateRequest, user=Depends(get_current_user)):
    return application_controller.handle_create(user, request)


@router.get("", response_model=None, summary="List my applications")
def list_applications(user=Depends(get_current_user)) -> list[dict[str, Any]]:
    return application_controller.handle_list(user)


@router.get("/{application_id}", response_model=None, summary="Get one of my applications")
def get_application(application_id: str, user=Depends(get_current_user)) -> dict[str, Any]:
    return application_controller.handle_get(user, application_id)


@router.patch(
    "/{application_id}/status",
    response_model=None,
    summary="Advance application status",
    description=(
        "Deterministic state machine: analysis_completed -> ready_to_apply -> "
        "application_started -> documents_submitted -> under_review -> approved|rejected. "
        "Invalid transitions return 422."
    ),
)
def update_status(
    application_id: str,
    request: ApplicationStatusUpdate,
    user=Depends(get_current_user),
) -> dict[str, Any]:
    return application_controller.handle_update_status(user, application_id, request)


@router.patch(
    "/{application_id}/documents",
    response_model=None,
    summary="Update submitted documents (recomputes readiness)",
)
def update_documents(
    application_id: str,
    request: ApplicationDocumentsUpdate,
    user=Depends(get_current_user),
) -> dict[str, Any]:
    return application_controller.handle_update_documents(user, application_id, request)
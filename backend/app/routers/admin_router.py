"""Admin endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.ai import rag_service
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter()


@router.post(
    "/schemes/reingest",
    response_model=None,
    summary="Re-ingest scheme documents into the RAG index (admin only)",
    description=(
        "Triggers document ingestion (PDF/text -> extract -> chunk -> embed -> index). "
        "Idempotent: stable chunk IDs mean re-ingestion overwrites, never duplicates."
    ),
)
def reingest(user=Depends(require_admin)) -> dict:
    result = rag_service.reingest_all()
    return {**result, "triggered_by": user.get("email")}


@router.get(
    "/schemes/ingest-status",
    response_model=None,
    summary="RAG index status (admin only)",
)
def ingest_status(_=Depends(require_admin)) -> dict:
    return rag_service.ingest_status()
"""AI controller: entry point for the LangGraph analysis pipeline."""

from __future__ import annotations

from typing import Any

from app.ai import graph
from app.ai import rag_service
from app.ai.llm_service import health_status as groq_status
from app.schemas.ai import AnalyzeRequest, FollowUpRequest
from app.utils.errors import DomainValidationError


def handle_analyze(request: AnalyzeRequest) -> dict[str, Any]:
    if not request.text and not request.profile:
        raise DomainValidationError("MISSING_INPUT", "Provide either 'text' or 'profile' in the request.")
    return graph.run_analysis(
        text=request.text,
        profile=request.profile,
        conversation_id=request.conversation_id,
    )


def handle_followup(request: FollowUpRequest) -> dict[str, Any]:
    return graph.run_analysis(
        text=request.text,
        profile=None,
        conversation_id=request.conversation_id,
    )


def handle_ai_status() -> dict[str, Any]:
    from app.config import settings

    return {
        "demo_mode": settings.demo_mode,
        "groq": groq_status(),
        "rag": rag_service.ingest_status(),
    }
"""AI analysis endpoints (LangGraph multi-agent pipeline)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.controllers import ai_controller
from app.schemas.ai import AiStatusResponse, AnalyzeRequest, FollowUpRequest

router = APIRouter()


@router.post(
    "/analyze",
    response_model=None,
    summary="Full AI analysis: intake, eligibility, explanation, partners",
    description=(
        "Runs the LangGraph pipeline: Intake Agent (NL or structured profile) -> flow routing "
        "(education/business) -> Eligibility Agent (deterministic rule engine + RAG evidence) -> "
        "Explanation Agent (AI narrated, deterministic fallback) -> Partner Agent (deterministic "
        "matching). Returns a user-safe reasoning trace, never chain-of-thought. All financial "
        "figures are deterministic."
    ),
    responses={422: {"description": "Validation error"}},
)
def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    return ai_controller.handle_analyze(request)


@router.post(
    "/analyze/followup",
    response_model=None,
    summary="Follow-up question on a previous analysis",
    description=(
        "Uses LangGraph memory (thread = conversation_id) to answer follow-ups such as "
        "'What if my project cost is 1.3 lakh?' without re-entering the full profile."
    ),
)
def followup(request: FollowUpRequest) -> dict[str, Any]:
    return ai_controller.handle_followup(request)


@router.get(
    "/ai/status",
    response_model=AiStatusResponse,
    summary="AI/RAG service availability",
    description="Reports whether Groq and Pinecone are configured/reachable.",
)
def ai_status() -> dict[str, Any]:
    return ai_controller.handle_ai_status()
"""Pydantic schemas for the AI analysis endpoints."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Natural-language requirement, e.g. 'I'm an OBC student with family income around 2.5 lakh and need 4 lakh for engineering.'",
    )
    profile: Optional[dict[str, Any]] = Field(
        default=None,
        description="Structured profile from the intake wizard (category, annual_income, age, project_cost, education_cost, purpose, is_education).",
    )
    conversation_id: Optional[str] = Field(default=None, max_length=64)


class FollowUpRequest(BaseModel):
    text: str = Field(min_length=2, max_length=500)
    conversation_id: str = Field(min_length=1, max_length=64)


class AiStatusResponse(BaseModel):
    demo_mode: bool
    groq: dict[str, Any]
    rag: dict[str, Any]
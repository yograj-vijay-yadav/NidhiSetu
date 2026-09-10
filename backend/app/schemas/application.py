"""Pydantic schemas for applications."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ApplicationCreateRequest(BaseModel):
    analysis: dict[str, Any] = Field(
        description="The serialized analysis result returned by /api/analyze."
    )


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(description="Target status; transitions are validated deterministically.")
    note: str | None = Field(default=None, max_length=300)


class ApplicationDocumentsUpdate(BaseModel):
    documents: list[str] = Field(
        description="Document keys from: identity_proof, address_proof, category_certificate, "
        "income_certificate, bank_details, project_report, admission_letter"
    )


class ApplicationOut(BaseModel):
    id: str
    user_id: str | None = None
    category: str | None = None
    input: dict[str, Any] = {}
    matched_schemes: list[dict[str, Any]] = []
    recommended_scheme: dict[str, Any] | None = None
    scheme_id: str | None = None
    emi: dict[str, Any] | None = None
    partners: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    explanation: str = ""
    readiness: dict[str, Any] = {}
    documents: list[str] = []
    requested_amount: float | None = None
    status: str = "analysis_completed"
    status_history: list[dict[str, Any]] = []
    conversation_id: str | None = None
    created_at: str = ""
    updated_at: str = ""
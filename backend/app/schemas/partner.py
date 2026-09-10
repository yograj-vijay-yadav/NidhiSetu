"""Pydantic schemas for partner matching."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.scheme import PartnerOut


class PartnerMatchRequest(BaseModel):
    scheme_id: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=60)
    max_distance_km: float | None = Field(default=None, gt=0, le=5000)
    limit: int = Field(default=10, ge=1, le=50)


class PartnerMatchResponse(BaseModel):
    partners: list[PartnerOut]
    total_found: int
    npa_excluded: int
    inactive_excluded: int
    is_demo_data: bool = True

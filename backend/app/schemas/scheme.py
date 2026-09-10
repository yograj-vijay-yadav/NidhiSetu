"""Pydantic schemas for the scheme matching flow."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.rules.scheme_rules import SUPPORTED_CATEGORIES


class EligibilityCheck(BaseModel):
    rule: str
    result: bool
    detail: str
    required: bool = True


class EligibilityResult(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str = Field(
        description="eligible | potentially_eligible | not_eligible | insufficient_information"
    )
    score: int
    checks: list[EligibilityCheck]
    missing_fields: list[str] = []
    near_threshold_fields: list[str] = []


class SchemeSummary(BaseModel):
    scheme_id: str
    name: str
    description: str = ""
    categories: list[str]
    purpose: list[str]
    loan_percentage: float
    interest_rate: float
    tenure_years: int
    moratorium_months: int
    moratorium_policy: str
    income_cap: Optional[float] = None
    max_project_cost: Optional[float] = None
    max_education_cost: Optional[float] = None
    max_loan_amount: Optional[float] = None
    minimum_age: int
    maximum_age: int
    channelizing_agencies: list[str] = []
    source_document: str
    is_demo_data: bool = True


class PartnerOut(BaseModel):
    id: str
    name: str
    agency: str = ""
    type: str = ""
    categories: list[str] = []
    schemes: list[str] = []
    city: str = ""
    state: str = ""
    address: str = ""
    distance_km: float = 0
    contact: str = ""
    npa_flag: bool = False
    is_active: bool = True
    match_score: float = 0


class EMIResult(BaseModel):
    loan_amount: float
    principal: float
    interest_accrued_during_moratorium: float
    repayment_months: int
    monthly_emi: float
    total_interest: float
    total_payment: float
    moratorium_months: int
    moratorium_policy: str
    annual_interest_rate: float
    tenure_years: float


class SchemeMatchRequest(BaseModel):
    category: str = Field(min_length=2, max_length=20)
    annual_income: Optional[float] = Field(default=None, ge=0, le=100_000_000)
    age: Optional[int] = Field(default=None, ge=1, le=100)
    project_cost: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    education_cost: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    purpose: Optional[str] = None
    is_education: bool = False

    @field_validator("category")
    @classmethod
    def category_supported(cls, v: str) -> str:
        if v.lower() not in SUPPORTED_CATEGORIES:
            raise ValueError(
                f"Unsupported category '{v}'. Supported: {', '.join(SUPPORTED_CATEGORIES)}."
            )
        return v.lower()

    @field_validator("purpose")
    @classmethod
    def purpose_known(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        allowed = {"business", "self_employment", "education", "skill_development"}
        if v.lower() not in allowed:
            raise ValueError(f"Purpose must be one of: {', '.join(sorted(allowed))}.")
        return v.lower()


class SchemeMatchResponse(BaseModel):
    input: dict[str, Any]
    matched_schemes: list[EligibilityResult]
    recommended_scheme: Optional[EligibilityResult]
    emi: Optional[EMIResult] = None
    partners: list[PartnerOut] = []
    explanation: str
    ai_meta: dict[str, Any] = {}
    citations: list[dict[str, Any]] = []
    rag_available: bool = False
    warning: Optional[str] = None
    reasoning_trace: list[dict[str, str]] = []
    is_demo_data: bool = True

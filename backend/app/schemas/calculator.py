"""Pydantic schemas for the EMI calculator."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.services.calculator_service import (
    POLICY_INTEREST_ACCRUES,
    POLICY_INTEREST_FREE,
    POLICY_NONE,
)


class EMIRequest(BaseModel):
    """Pure calculator request. All math is deterministic."""

    principal: float = Field(gt=0, le=1_000_000_000, description="Loan principal in ₹")
    annual_interest_rate: float = Field(ge=0, le=1, description="Annual rate as decimal, e.g. 0.065")
    tenure_years: float = Field(gt=0, le=40, description="Tenure in years")
    moratorium_months: int = Field(default=0, ge=0, le=120)
    moratorium_policy: str = Field(default=POLICY_INTEREST_ACCRUES)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "principal": 126000,
                    "annual_interest_rate": 0.065,
                    "tenure_years": 3,
                    "moratorium_months": 3,
                    "moratorium_policy": "interest_accrues",
                }
            ]
        }
    }


class EMIResponse(BaseModel):
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


class FinancingRequest(BaseModel):
    project_cost: float = Field(gt=0, le=1_000_000_000)
    loan_percentage: float = Field(gt=0, le=1)
    max_loan_amount: Optional[float] = Field(default=None, gt=0)


class FinancingResponse(BaseModel):
    loan_amount: float
    own_contribution: float
    loan_percentage: float

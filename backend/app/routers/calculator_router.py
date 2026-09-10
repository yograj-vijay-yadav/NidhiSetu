"""Calculator endpoints (deterministic only)."""

from __future__ import annotations

from fastapi import APIRouter

from app.controllers import calculator_controller
from app.schemas.calculator import EMIRequest, EMIResponse, FinancingRequest, FinancingResponse

router = APIRouter()


@router.post(
    "/emi",
    response_model=EMIResponse,
    summary="Pure EMI calculation",
    description=(
        "Deterministic EMI mathematics. Never calls an LLM. Supports moratorium "
        "policies: interest_accrues (interest accrues and principal is augmented), "
        "interest_free_deferred (no interest) and no_moratorium (standard annuity)."
    ),
    responses={422: {"description": "Validation error"}},
)
def calculate_emi(request: EMIRequest) -> EMIResponse:
    return calculator_controller.handle_emi(request)


@router.post(
    "/financing",
    response_model=FinancingResponse,
    summary="Scheme financing split",
    description="Deterministic loan amount and own-contribution split for a project cost.",
    responses={422: {"description": "Validation error"}},
)
def calculate_financing(request: FinancingRequest) -> FinancingResponse:
    return calculator_controller.handle_financing(request)

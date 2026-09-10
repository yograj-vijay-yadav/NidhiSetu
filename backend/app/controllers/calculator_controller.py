"""Calculator controller: thin bridge between router and pure EMI service."""

from __future__ import annotations

from app.schemas.calculator import EMIRequest, EMIResponse, FinancingRequest, FinancingResponse
from app.services import calculator_service


def handle_emi(request: EMIRequest) -> EMIResponse:
    result = calculator_service.calculate_emi(
        principal=request.principal,
        annual_interest_rate=request.annual_interest_rate,
        tenure_years=request.tenure_years,
        moratorium_months=request.moratorium_months,
        moratorium_policy=request.moratorium_policy,
    )
    return EMIResponse(**result)


def handle_financing(request: FinancingRequest) -> FinancingResponse:
    result = calculator_service.scheme_financing(
        project_cost=request.project_cost,
        loan_percentage=request.loan_percentage,
        max_loan_amount=request.max_loan_amount,
    )
    return FinancingResponse(**result)

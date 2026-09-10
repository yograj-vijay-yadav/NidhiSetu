"""Scheme endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.controllers import scheme_controller
from app.schemas.scheme import SchemeMatchRequest, SchemeMatchResponse, SchemeSummary

router = APIRouter()


@router.get(
    "",
    response_model=list[SchemeSummary],
    summary="List all configured schemes",
    description="Public catalogue of every scheme in the (demo) rule corpus.",
)
def list_schemes() -> list[SchemeSummary]:
    return scheme_controller.handle_list_schemes()


@router.post(
    "/match",
    response_model=SchemeMatchResponse,
    summary="Match schemes for a beneficiary profile",
    description=(
        "Runs the deterministic eligibility engine over all configured schemes for the "
        "beneficiary's category, then adds indicative EMI, partner matches and an "
        "explanation (AI with deterministic fallback). Eligibility verdicts and all "
        "figures are computed WITHOUT any LLM."
    ),
    responses={
        200: {"description": "Matching completed (may contain zero eligible schemes)"},
        422: {"description": "Validation error (unsupported category, negative amounts, ...)"},
    },
)
def match_schemes(request: SchemeMatchRequest) -> SchemeMatchResponse:
    return scheme_controller.handle_scheme_match(request)


@router.post(
    "/what-if",
    response_model=None,
    summary="Deterministic what-if simulation",
    description=(
        "Re-runs the deterministic eligibility engine with overridden profile values "
        "(income, project_cost, education_cost, age, purpose, is_education). This is the "
        "engine behind the What-If Simulator UI. No LLM is involved."
    ),
)
def what_if(request: SchemeMatchRequest) -> dict[str, Any]:
    body: dict[str, Any] = request.model_dump()
    overrides = {
        k: body[k]
        for k in (
            "annual_income",
            "age",
            "project_cost",
            "education_cost",
            "purpose",
            "is_education",
        )
        if body.get(k) is not None
    }
    return scheme_controller.handle_what_if(request, overrides)

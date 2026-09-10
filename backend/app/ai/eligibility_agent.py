"""Eligibility Agent.

AI WORLD component that NEVER overrides the deterministic rule engine:

    LLM interpretation (intake)
        -> structured profile
        -> deterministic eligibility engine   (authoritative)
        -> RAG evidence retrieval            (context, never a verdict)
        -> AI explanation                    (narrates, never decides)

The verdicts in `eligibility_results` come straight from the rule engine.
RAG citations are attached for transparency and never change outcomes.
"""

from __future__ import annotations

from typing import Any

from app.ai import rag_service
from app.services import calculator_service, eligibility_service, partner_service


def run_eligibility(state: dict[str, Any]) -> dict[str, Any]:
    """Node body: deterministic eligibility + RAG evidence + financing."""
    profile = state.get("normalized_input") or {}
    category = profile.get("category", "")
    is_education = bool(profile.get("is_education", False))

    results = eligibility_service.evaluate_all_schemes(
        category=category,
        annual_income=profile.get("annual_income"),
        age=profile.get("age"),
        project_cost=profile.get("project_cost"),
        education_cost=profile.get("education_cost"),
        purpose=profile.get("purpose"),
        is_education=is_education,
    )
    recommended = eligibility_service.best_scheme(results)

    cost = profile.get("education_cost") if is_education else profile.get("project_cost")
    emi = None
    if recommended:
        rule = eligibility_service.get_rule(recommended["scheme_id"])
        if rule and cost and cost > 0:
            financing = calculator_service.scheme_financing(
                project_cost=float(cost),
                loan_percentage=rule.loan_percentage,
                max_loan_amount=rule.max_loan_amount,
            )
            emi = calculator_service.calculate_emi(
                principal=financing["loan_amount"],
                annual_interest_rate=rule.interest_rate,
                tenure_years=rule.tenure_years,
                moratorium_months=rule.moratorium_months,
                moratorium_policy=rule.moratorium_policy,
            )
            emi["financing"] = financing

    retrieved, rag_available, warning = rag_service.retrieve(
        profile=profile,
        scheme_ids=[r["scheme_id"] for r in results],
    )

    return {
        "eligibility_results": results,
        "recommended_scheme": recommended,
        "emi": emi,
        "retrieved_context": retrieved,
        "rag_available": rag_available,
        "rag_warning": warning,
        "reasoning_trace": state.get("reasoning_trace", [])
        + [
            {
                "agent": "Eligibility Agent",
                "action": f"Evaluated {len(results)} applicable schemes with the deterministic rule engine",
            },
            {
                "agent": "Eligibility Engine",
                "action": (
                    f"{sum(1 for r in results if r['status'] in ('eligible', 'potentially_eligible'))} "
                    "scheme(s) passed the configured deterministic checks"
                ),
            },
            {
                "agent": "RAG Service",
                "action": (
                    "Retrieved supporting evidence"
                    if rag_available
                    else "Official document retrieval unavailable (demo fallback)"
                ),
            },
        ],
    }


def route_from_intake(state: dict[str, Any]) -> str:
    """Conditional routing: clarification stops the graph; otherwise branch
    education vs business flows (both converge on eligibility)."""
    if state.get("needs_clarification"):
        return "clarify"
    is_education = bool((state.get("normalized_input") or {}).get("is_education"))
    return "education" if is_education else "business"


def run_education_flow(state: dict[str, Any]) -> dict[str, Any]:
    """Education flow node: tags the flow and records the branch in the trace."""
    return {
        "flow": "education",
        "reasoning_trace": state.get("reasoning_trace", [])
        + [{"agent": "Flow Router", "action": "Education flow selected (education/skilling profile)"}],
    }


def run_business_flow(state: dict[str, Any]) -> dict[str, Any]:
    """Business flow node: tags the flow and records the branch in the trace."""
    return {
        "flow": "business",
        "reasoning_trace": state.get("reasoning_trace", [])
        + [{"agent": "Flow Router", "action": "Business flow selected (business/self-employment profile)"}],
    }
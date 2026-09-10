"""Scheme matching orchestration.

Brings the deterministic world together for the /api/schemes/match flow:
eligibility ranking -> financing + EMI -> partner matching -> explanation
(AI layer with deterministic fallback) -> reasoning trace. The eligibility
verdicts, EMI numbers and partner filtering below are deterministic; the LLM
only narrates them.
"""

from __future__ import annotations

from typing import Any

from app.ai import llm_service
from app.rules.scheme_rules import SchemeRule, get_scheme_by_id, load_rules_for_category
from app.services import calculator_service, eligibility_service, partner_service
from app.utils.errors import DomainValidationError


def normalize_profile(payload: dict[str, Any]) -> dict[str, Any]:
    """Normalize raw request payload into the canonical profile shape."""
    category = str(payload.get("category", "")).strip().lower()
    purpose = payload.get("purpose")
    purpose = str(purpose).strip().lower() if purpose else None

    is_education = bool(payload.get("is_education", False))
    if purpose == "education":
        is_education = True

    def _num(key: str) -> float | None:
        value = payload.get(key)
        if value is None or value == "":
            return None
        try:
            value = float(value)
        except (TypeError, ValueError):
            return None
        return value

    return {
        "category": category,
        "annual_income": _num("annual_income"),
        "age": None if payload.get("age") is None else int(payload["age"]),
        "project_cost": _num("project_cost"),
        "education_cost": _num("education_cost"),
        "purpose": purpose,
        "is_education": is_education,
    }


def financing_for(scheme_id: str, cost: float | None) -> dict[str, Any] | None:
    rule = get_scheme_by_id(scheme_id)
    if rule is None or cost is None or cost <= 0:
        return None
    return calculator_service.scheme_financing(
        project_cost=cost,
        loan_percentage=rule.loan_percentage,
        max_loan_amount=rule.max_loan_amount,
    )


def emi_for(scheme_id: str, cost: float | None) -> dict[str, Any] | None:
    """Deterministic EMI breakdown for a scheme given a project/education cost."""
    rule = get_scheme_by_id(scheme_id)
    if rule is None or cost is None or cost <= 0:
        return None
    financing = calculator_service.scheme_financing(
        project_cost=cost,
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
    return {"financing": financing, **emi}


def _deterministic_explanation(
    result: dict[str, Any],
    emi: dict[str, Any] | None,
    is_education: bool,
) -> str:
    """Fallback explanation composed purely from deterministic facts."""
    parts = [
        f"Based on the configured (demo) criteria for {result['scheme_name']}, your profile "
        f"is {result['status'].replace('_', ' ')}."
    ]
    failed = [c for c in result["checks"] if not c["result"]]
    if failed:
        parts.append("Checks that did not pass: " + "; ".join(c["detail"] for c in failed) + ".")
    else:
        parts.append("All configured eligibility checks passed.")
    if emi:
        parts.append(
            f"Indicative EMI would be about ₹{emi['monthly_emi']:,.0f} per month for "
            f"₹{emi['loan_amount']:,.0f} over {emi['repayment_months']} months."
        )
    parts.append(
        "Note: figures use DEMO/PLACEHOLDER scheme data; verify against official guidelines before applying."
    )
    return " ".join(parts)


def _llm_explanation(
    profile: dict[str, Any],
    ranked: list[dict[str, Any]],
    recommended: dict[str, Any] | None,
    emi: dict[str, Any] | None,
) -> tuple[str, dict[str, Any]]:
    """AI narration of deterministic facts; falls back deterministically."""
    if recommended is None:
        return (
            "Based on the details provided, none of the configured (demo) schemes match this profile. "
            "Review the failed eligibility checks below or try the what-if simulator with different values.",
            {"fallback_used": True, "fallback_reason": "no eligible scheme"},
        )

    fallback = _deterministic_explanation(recommended, emi, profile["is_education"])
    checks_summary = "; ".join(
        f"{c['rule']}: {'pass' if c['result'] else 'fail'}" for c in recommended["checks"]
    )
    rejected = [
        r["scheme_id"]
        for r in ranked
        if r["scheme_id"] != recommended["scheme_id"] and r["status"] == "not_eligible"
    ]
    user_prompt = (
        f"Beneficiary profile (all figures are user-declared): category={profile['category']}, "
        f"annual_income={profile['annual_income']}, age={profile['age']}, "
        f"project_cost={profile['project_cost']}, education_cost={profile['education_cost']}, "
        f"purpose={profile['purpose']}, is_education={profile['is_education']}. "
        f"Recommended scheme: {recommended['scheme_name']} (status={recommended['status']}, "
        f"score={recommended['score']}). Deterministic checks: {checks_summary}. "
        + (f"Indicative EMI: ₹{emi['monthly_emi']:,.0f}/month. " if emi else "")
        + (
            f"Schemes rejected by the rule engine: {', '.join(rejected)}. "
            if rejected
            else "No other schemes were rejected outright. "
        )
        + "Explain in at most 90 words, simple language, why this scheme fits and what to do next. "
        "Use 'potentially eligible' wording. Never promise approval. Do not invent numbers."
    )
    system_prompt = (
        "You are NidhiSetu's scheme advisor. You explain PRE-COMPUTED deterministic eligibility and "
        "EMI results to Indian government scheme beneficiaries. You never change, recalculate or "
        "override the numbers given to you. Never claim a loan is approved."
    )
    ai = llm_service.complete(
        system_prompt,
        user_prompt,
        max_tokens=320,
        fallback_text=fallback,
    )
    meta = {
        "fallback_used": ai.fallback_used,
        "fallback_reason": ai.fallback_reason if ai.fallback_used else None,
        "model": ai.model,
    }
    return ai.text, meta


def _trace(steps: list[dict[str, str]]) -> list[dict[str, str]]:
    return steps


def match_schemes(payload: dict[str, Any]) -> dict[str, Any]:
    """Full deterministic match pipeline (Phase 1 core)."""
    profile = normalize_profile(payload)

    if not profile["category"]:
        raise DomainValidationError("MISSING_CATEGORY", "Beneficiary category is required.")

    ranked = eligibility_service.evaluate_all_schemes(
        category=profile["category"],
        annual_income=profile["annual_income"],
        age=profile["age"],
        project_cost=profile["project_cost"],
        education_cost=profile["education_cost"],
        purpose=profile["purpose"],
        is_education=profile["is_education"],
    )
    recommended = eligibility_service.best_scheme(ranked)

    cost = profile["education_cost"] if profile["is_education"] else profile["project_cost"]
    emi = emi_for(recommended["scheme_id"], cost) if recommended else None

    partners = partner_service.match_partners(
        scheme_id=recommended["scheme_id"] if recommended else None,
        category=profile["category"],
        limit=5,
    ) if recommended else []

    explanation, ai_meta = _llm_explanation(profile, ranked, recommended, emi)

    trace = _trace(
        [
            {"agent": "Profile Normalizer", "action": "Normalized beneficiary information"},
            {
                "agent": "Eligibility Engine",
                "action": f"Evaluated {len(ranked)} configured schemes deterministically",
            },
            {
                "agent": "Eligibility Engine",
                "action": (
                    f"{sum(1 for r in ranked if r['status'] in ('eligible', 'potentially_eligible'))} "
                    "scheme(s) passed the configured checks"
                ),
            },
            {"agent": "EMI Calculator", "action": "Computed indicative financing and EMI"},
            {"agent": "Partner Service", "action": "Filtered inactive and NPA-flagged partners"},
            {
                "agent": "Explanation Agent",
                "action": (
                    "Generated explanation (demo fallback)"
                    if ai_meta.get("fallback_used")
                    else "Generated explanation from deterministic results"
                ),
            },
        ]
    )

    return {
        "input": profile,
        "matched_schemes": ranked,
        "recommended_scheme": recommended,
        "emi": emi,
        "partners": partners,
        "explanation": explanation,
        "ai_meta": ai_meta,
        "citations": [],
        "rag_available": False,
        "warning": (
            "Official document retrieval is not configured yet; DEMO/PLACEHOLDER scheme rules were used."
        ),
        "reasoning_trace": trace,
        "is_demo_data": True,
    }

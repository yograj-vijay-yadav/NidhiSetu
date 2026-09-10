"""Deterministic eligibility rule engine.

This module is the single source of truth for eligibility decisions. It NEVER
calls an LLM and NEVER performs I/O beyond reading immutable rule data: same
input in, same structured verdict out. The AI layer may *interpret* these
verdicts, but can never change them.

Status semantics:
- eligible:               every check passed, nothing borderline
- potentially_eligible:   every hard check passed but one or more values sit
                          within the near-threshold band (>= 95% of a cap), or
                          optional context (purpose) was missing
- not_eligible:           at least one hard check failed
- insufficient_information: required inputs were missing (income/age/cost)
"""

from __future__ import annotations

from typing import Any

from app.rules.scheme_rules import SchemeRule

STATUS_ELIGIBLE = "eligible"
STATUS_POTENTIALLY_ELIGIBLE = "potentially_eligible"
STATUS_NOT_ELIGIBLE = "not_eligible"
STATUS_INSUFFICIENT_INFO = "insufficient_information"

NEAR_THRESHOLD_RATIO = 0.95


def _check(name: str, passed: bool, detail: str, required: bool = True) -> dict[str, Any]:
    return {
        "rule": name,
        "result": passed,
        "detail": detail,
        "required": required,
    }


def _near(cap: float, value: float) -> bool:
    """True when value sits in the top band just below a cap (or exactly at it)."""
    return cap > 0 and value >= NEAR_THRESHOLD_RATIO * cap


def evaluate_scheme(
    rule: SchemeRule,
    category: str,
    annual_income: float | None,
    age: int | None,
    project_cost: float | None,
    education_cost: float | None,
    purpose: str | None,
    is_education: bool,
) -> dict[str, Any]:
    """Evaluate one scheme against a normalized beneficiary profile."""
    checks: list[dict[str, Any]] = []
    borderline = False

    income = annual_income
    cost = education_cost if is_education else project_cost
    if cost is None:
        cost = project_cost if project_cost is not None else education_cost

    # --- Required information (deterministic, no guessing) ---
    missing: list[str] = []
    if income is None:
        missing.append("annual_income")
    if age is None:
        missing.append("age")
    if cost is None:
        missing.append("education_cost" if is_education else "project_cost")
    if missing:
        return {
            "scheme_id": rule.scheme_id,
            "scheme_name": rule.name,
            "status": STATUS_INSUFFICIENT_INFO,
            "score": 0,
            "checks": [
                _check(
                    "required_information",
                    False,
                    f"Missing required field(s): {', '.join(missing)}",
                )
            ],
            "missing_fields": missing,
            "near_threshold_fields": [],
        }

    # --- 1. Category compatibility ---
    cat_ok = category.lower() in rule.categories
    checks.append(
        _check(
            "category",
            cat_ok,
            f"Category '{category}' {'is' if cat_ok else 'is not'} served by this scheme",
        )
    )

    # --- 2. Income cap (None cap means open) ---
    if rule.income_cap is not None:
        income_ok = income <= rule.income_cap
        checks.append(
            _check(
                "income",
                income_ok,
                f"Annual income ₹{income:,.0f} vs cap ₹{rule.income_cap:,.0f}",
            )
        )
        if income_ok and _near(rule.income_cap, income):
            borderline = True
    else:
        checks.append(_check("income", True, "No income cap configured for this scheme", required=False))

    # --- 3. Age window ---
    age_ok = rule.minimum_age <= age <= rule.maximum_age
    checks.append(
        _check(
            "age",
            age_ok,
            f"Age {age} must be within {rule.minimum_age}-{rule.maximum_age}",
        )
    )
    if age_ok and (age == rule.maximum_age or age == rule.minimum_age):
        borderline = True

    # --- 4. Project / education cost cap ---
    cap = rule.cost_cap_for(is_education)
    if cap is not None:
        cost_ok = cost <= cap
        label = "education_cost" if is_education else "project_cost"
        checks.append(
            _check(
                "project_cost" if not is_education else "education_cost",
                cost_ok,
                f"Cost ₹{cost:,.0f} vs cap ₹{cap:,.0f}",
            )
        )
        if cost_ok and _near(cap, cost):
            borderline = True
    else:
        checks.append(_check("project_cost", True, "No cost cap configured for this scheme", required=False))

    # --- 5. Purpose compatibility ---
    purpose_ok = rule.supports_purpose(is_education, purpose)
    checks.append(
        _check(
            "purpose",
            purpose_ok,
            f"Purpose '{purpose or ('education' if is_education else 'business')}' "
            f"{'supported' if purpose_ok else 'not supported'} (scheme serves: {', '.join(rule.purpose)})",
        )
    )

    hard_failures = [c for c in checks if c["required"] and not c["result"]]
    passed_all = not hard_failures

    if not passed_all:
        status = STATUS_NOT_ELIGIBLE
        score = 0
    elif borderline or purpose is None:
        status = STATUS_POTENTIALLY_ELIGIBLE
        score = 75
    else:
        status = STATUS_ELIGIBLE
        score = 92

    return {
        "scheme_id": rule.scheme_id,
        "scheme_name": rule.name,
        "status": status,
        "score": score,
        "checks": checks,
        "missing_fields": [],
        "near_threshold_fields": ["cost" if borderline else None] if borderline else [],
    }

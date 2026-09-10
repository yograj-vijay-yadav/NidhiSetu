"""Eligibility service: orchestrates the deterministic rule engine.

Loads data-driven scheme rules for the beneficiary's category, evaluates every
applicable scheme with the rule engine, and returns ranked structured results.
No LLM is involved at any point.
"""

from __future__ import annotations

from typing import Any

from app.rules import rule_engine
from app.rules.scheme_rules import SchemeRule, load_rules_for_category
from app.utils.errors import DomainValidationError


def evaluate_all_schemes(
    category: str,
    annual_income: float | None,
    age: int | None,
    project_cost: float | None,
    education_cost: float | None,
    purpose: str | None,
    is_education: bool,
) -> list[dict[str, Any]]:
    """Evaluate every category-relevant scheme; deterministic and ordered."""
    rules = load_rules_for_category(category)
    results = [
        rule_engine.evaluate_scheme(
            rule=rule,
            category=category,
            annual_income=annual_income,
            age=age,
            project_cost=project_cost,
            education_cost=education_cost,
            purpose=purpose,
            is_education=is_education,
        )
        for rule in rules
    ]

    rank = {
        rule_engine.STATUS_ELIGIBLE: 0,
        rule_engine.STATUS_POTENTIALLY_ELIGIBLE: 1,
        rule_engine.STATUS_INSUFFICIENT_INFO: 2,
        rule_engine.STATUS_NOT_ELIGIBLE: 3,
    }
    results.sort(key=lambda r: (rank[r["status"]], -r["score"], r["scheme_id"]))
    return results


def eligible_schemes(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        r
        for r in results
        if r["status"] in (rule_engine.STATUS_ELIGIBLE, rule_engine.STATUS_POTENTIALLY_ELIGIBLE)
    ]


def best_scheme(results: list[dict[str, Any]]) -> dict[str, Any] | None:
    elig = eligible_schemes(results)
    return elig[0] if elig else None


def get_rule(scheme_id: SchemeRule | str) -> SchemeRule | None:
    """Resolve a scheme id to its rule (helper for other services)."""
    if isinstance(scheme_id, SchemeRule):
        return scheme_id
    from app.rules.scheme_rules import get_scheme_by_id

    return get_scheme_by_id(scheme_id)


def build_what_if(
    base_profile: dict[str, Any],
    overrides: dict[str, Any],
) -> dict[str, Any]:
    """Re-run eligibility with overridden profile values (What-If Simulator).

    Purely deterministic: merge overrides onto the base profile and evaluate.
    """
    merged = {**base_profile, **{k: v for k, v in overrides.items() if v is not None}}
    results = evaluate_all_schemes(
        category=str(merged["category"]),
        annual_income=merged.get("annual_income"),
        age=merged.get("age"),
        project_cost=merged.get("project_cost"),
        education_cost=merged.get("education_cost"),
        purpose=merged.get("purpose"),
        is_education=bool(merged.get("is_education", False)),
    )
    return {
        "applied_overrides": {k: v for k, v in overrides.items() if v is not None},
        "effective_profile": merged,
        "results": results,
    }


__all__ = [
    "evaluate_all_schemes",
    "eligible_schemes",
    "best_scheme",
    "get_rule",
    "build_what_if",
    "DomainValidationError",
]

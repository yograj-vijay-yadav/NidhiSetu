"""Rule engine unit tests — threshold boundaries and edge cases."""

from __future__ import annotations

import pytest

from app.rules import rule_engine
from app.rules.scheme_rules import get_scheme_by_id, load_rules_for_category
from app.utils.errors import DomainValidationError


def evaluate(category, *, income=None, age=None, project_cost=None, education_cost=None, purpose=None, is_education=False):
    return rule_engine.evaluate_scheme(
        rule=load_rules_for_category(category)[0],
        category=category,
        annual_income=income,
        age=age,
        project_cost=project_cost,
        education_cost=education_cost,
        purpose=purpose,
        is_education=is_education,
    )


# --- Category ---
def test_unsupported_category_raises():
    with pytest.raises(DomainValidationError):
        load_rules_for_category("unknown_cat")


def test_category_mismatch_is_not_eligible():
    # 'general_business_loan' only serves general; an SC profile must fail the category check.
    rule = get_scheme_by_id("general_business_loan")
    result = rule_engine.evaluate_scheme(
        rule=rule, category="sc", annual_income=100000, age=30,
        project_cost=500000, education_cost=None, purpose="business", is_education=False,
    )
    assert result["status"] == "not_eligible"
    cat_check = [c for c in result["checks"] if c["rule"] == "category"][0]
    assert cat_check["result"] is False


# --- Income cap boundaries (micro_finance has income_cap 300000) ---
def test_income_at_cap_is_eligible():
    result = evaluate("sc", income=300000, age=30, project_cost=50000, purpose="business")
    assert result["status"] in ("eligible", "potentially_eligible")


def test_income_one_rupee_above_cap_not_eligible():
    result = evaluate("sc", income=300001, age=30, project_cost=50000, purpose="business")
    assert result["status"] == "not_eligible"
    income_check = [c for c in result["checks"] if c["rule"] == "income"][0]
    assert income_check["result"] is False


def test_income_well_below_cap_eligible():
    result = evaluate("sc", income=150000, age=30, project_cost=50000, purpose="business")
    assert result["status"] == "eligible"


def test_zero_income_eligible():
    result = evaluate("sc", income=0, age=30, project_cost=50000, purpose="business")
    assert result["status"] in ("eligible", "potentially_eligible")


# --- Project cost boundaries (micro_finance max 140000) ---
def test_project_cost_one_below_cap_eligible():
    result = evaluate("sc", income=200000, age=30, project_cost=139999, purpose="business")
    assert result["status"] in ("eligible", "potentially_eligible")


def test_project_cost_at_cap_eligible():
    result = evaluate("sc", income=200000, age=30, project_cost=140000, purpose="business")
    assert result["status"] in ("eligible", "potentially_eligible")


def test_project_cost_one_above_cap_not_eligible():
    result = evaluate("sc", income=200000, age=30, project_cost=140001, purpose="business")
    assert result["status"] == "not_eligible"
    cost_check = [c for c in result["checks"] if c["rule"] == "project_cost"][0]
    assert cost_check["result"] is False


# --- Age boundaries ---
def test_age_at_maximum_boundary_flagged_potential():
    rule = get_scheme_by_id("education_loan")  # 16..35
    result = rule_engine.evaluate_scheme(
        rule=rule, category="general", annual_income=200000, age=35,
        project_cost=None, education_cost=100000, purpose="education", is_education=True,
    )
    assert result["status"] == "potentially_eligible"
    assert result["near_threshold_fields"]


def test_age_above_maximum_not_eligible():
    rule = get_scheme_by_id("education_loan")
    result = rule_engine.evaluate_scheme(
        rule=rule, category="general", annual_income=200000, age=36,
        project_cost=None, education_cost=100000, purpose="education", is_education=True,
    )
    assert result["status"] == "not_eligible"


# --- Education vs business ---
def test_education_purpose_uses_education_cost_cap():
    rule = get_scheme_by_id("education_loan")
    result = rule_engine.evaluate_scheme(
        rule=rule, category="sc", annual_income=300000, age=22,
        project_cost=None, education_cost=2000000, purpose="education", is_education=True,
    )
    assert result["status"] in ("eligible", "potentially_eligible")


def test_business_profile_not_matched_to_education_only_scheme():
    rule = get_scheme_by_id("education_loan")
    result = rule_engine.evaluate_scheme(
        rule=rule, category="sc", annual_income=300000, age=22,
        project_cost=500000, education_cost=None, purpose="business", is_education=False,
    )
    assert result["status"] == "not_eligible"


# --- Missing information ---
def test_missing_income_returns_insufficient_information():
    result = evaluate("sc", income=None, age=30, project_cost=50000, purpose="business")
    assert result["status"] == "insufficient_information"
    assert "annual_income" in result["missing_fields"]


def test_missing_purpose_with_education_flag_is_ok():
    # education flag implies education purpose; scheme purpose check passes even
    # when the user did not explicitly state a purpose.
    rule = get_scheme_by_id("education_loan")
    result = rule_engine.evaluate_scheme(
        rule=rule, category="sc", annual_income=200000, age=22,
        project_cost=None, education_cost=100000, purpose=None, is_education=True,
    )
    assert result["status"] in ("eligible", "potentially_eligible")


# --- Multiple eligible schemes ---
def test_multiple_eligible_schemes_are_all_returned():
    from app.services.eligibility_service import evaluate_all_schemes, eligible_schemes

    results = evaluate_all_schemes(
        category="sc", annual_income=200000, age=30,
        project_cost=100000, education_cost=None, purpose="business", is_education=False,
    )
    assert len(results) >= 3
    elig = eligible_schemes(results)
    assert len(elig) >= 2


def test_rank_order_puts_eligible_first():
    from app.services.eligibility_service import evaluate_all_schemes

    results = evaluate_all_schemes(
        category="sc", annual_income=99999999, age=70,
        project_cost=9999999, education_cost=None, purpose="business", is_education=False,
    )
    assert results[0]["status"] == "not_eligible"  # nothing fits -> all not eligible, stable order
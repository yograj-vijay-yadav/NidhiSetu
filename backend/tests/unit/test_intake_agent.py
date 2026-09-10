"""Intake agent tests (deterministic path — no Groq key in CI)."""

from __future__ import annotations

from app.ai import intake_agent
from app.ai.intake_agent import (
    clarification_question,
    deterministic_parse,
    is_followup,
    merge_followup,
    missing_fields,
    normalize_profile,
)


def test_parse_obc_student_education():
    parsed = deterministic_parse(
        "I'm an OBC student with family income around 2.5 lakh and need 4 lakh for engineering."
    )
    assert parsed["category"] == "obc"
    assert parsed["annual_income"] == 250000
    assert parsed["education_cost"] == 400000
    assert parsed["is_education"] is True


def test_parse_women_entrepreneur_business():
    parsed = deterministic_parse(
        "I'm a woman entrepreneur looking for around 5 lakh to start a small business."
    )
    assert parsed["category"] == "women"
    assert parsed["project_cost"] == 500000
    assert parsed["purpose"] == "business"


def test_parse_no_hallucination_for_missing_income():
    parsed = deterministic_parse("I am an SC beneficiary and I want a loan for a shop.")
    assert parsed["category"] == "sc"
    assert parsed["annual_income"] is None
    assert parsed["project_cost"] is None


def test_parse_never_invents_age():
    parsed = deterministic_parse("I need 2 lakh for my business")
    assert parsed["age"] is None


def test_parse_age_extraction():
    parsed = deterministic_parse("I am 27 years old, SC, income 2 lakh, business cost 5 lakh")
    assert parsed["age"] == 27


def test_parse_crore_conversion():
    parsed = deterministic_parse("project cost is 1.5 crore for my enterprise")
    assert parsed["project_cost"] == 15000000


def test_parse_minority_keyword():
    assert deterministic_parse("I belong to the minority community")["category"] == "minority"


def test_followup_detection():
    assert is_followup("What if my project cost is 1.3 lakh?")
    assert is_followup("what about increasing the loan to 3 lakh")
    assert not is_followup("I need a business loan of 2 lakh")


def test_merge_followup_updates_cost_only():
    previous = {
        "category": "sc",
        "annual_income": 250000,
        "age": 27,
        "project_cost": 500000,
        "purpose": "business",
        "is_education": False,
    }
    merged = merge_followup(previous, {"project_cost": 130000})
    assert merged["project_cost"] == 130000
    assert merged["annual_income"] == 250000  # untouched
    assert merged["category"] == "sc"


def test_missing_fields_reports_whats_absent():
    profile = {"category": "sc", "annual_income": 200000, "age": 30, "project_cost": None, "is_education": False}
    assert "project_cost" in missing_fields(profile)
    profile["project_cost"] = 100000
    assert missing_fields(profile) == []


def test_clarification_question_lists_questions():
    question = clarification_question(["category", "annual_income"])
    assert "category" in question
    assert "income" in question


def test_normalize_profile_coerces_types():
    normalized = normalize_profile(
        {"category": "SC", "annual_income": "250000", "age": "27", "project_cost": 500000, "purpose": "Business"}
    )
    assert normalized["category"] == "sc"
    assert normalized["annual_income"] == 250000.0
    assert normalized["age"] == 27
    assert normalized["purpose"] == "business"
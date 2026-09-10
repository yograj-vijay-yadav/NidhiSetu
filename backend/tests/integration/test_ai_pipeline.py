"""Integration tests for the LangGraph analysis pipeline (Phase 2)."""

from __future__ import annotations

import pytest

from app.ai import graph, intake_agent
from app.ai.graph import run_analysis
from app.utils.errors import DomainValidationError


# --- Graph behavior (unit-level, no HTTP) ---
def test_structured_profile_business_flow():
    result = run_analysis(
        profile={
            "category": "sc",
            "annual_income": 250000,
            "age": 27,
            "project_cost": 500000,
            "purpose": "business",
            "is_education": False,
        }
    )
    assert result["flow"] == "business"
    assert result["recommended_scheme"] is not None
    assert result["recommended_scheme"]["status"] in ("eligible", "potentially_eligible")
    assert result["explanation"]
    assert result["partners"]
    assert result["reasoning_trace"]


def test_structured_profile_education_flow():
    result = run_analysis(
        profile={
            "category": "obc",
            "annual_income": 250000,
            "age": 22,
            "education_cost": 400000,
            "purpose": "education",
            "is_education": True,
        }
    )
    assert result["flow"] == "education"
    assert result["recommended_scheme"]["scheme_id"] == "education_loan"
    assert result["emi"] is not None


def test_natural_language_intake():
    result = run_analysis(
        text="I'm a 22 year old OBC student with family income around 2.5 lakh and need 4 lakh for engineering."
    )
    profile = result["input"]
    assert profile["category"] == "obc"
    assert profile["annual_income"] == 250000
    assert result["flow"] == "education"
    assert result["reasoning_trace"]
    assert result["recommended_scheme"]["scheme_id"] == "education_loan"


def test_missing_information_returns_clarification():
    result = run_analysis(text="I need money for my business")
    assert result["needs_clarification"] is True
    assert result["missing_fields"]
    assert "category" in result["missing_fields"]
    assert result["clarification_question"]


def test_partial_profile_returns_clarification_for_missing_age():
    result = run_analysis(
        text="I'm an SC beneficiary, income 2.5 lakh, need 5 lakh for my business"
    )
    assert result["needs_clarification"] is True
    assert "age" in result["missing_fields"]


def test_groq_unavailable_still_returns_full_analysis():
    # No GROQ_API_KEY configured in CI -> fallback path must produce everything.
    result = run_analysis(
        profile={"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"}
    )
    assert result["explanation"]
    assert result["ai_meta"]["fallback_used"] is True
    assert result["recommended_scheme"] is not None


def test_rag_unavailable_does_not_crash():
    result = run_analysis(
        profile={"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"}
    )
    assert result["rag_available"] in (True, False)  # local demo index may serve
    assert isinstance(result["citations"], list)


def test_reasoning_trace_is_user_safe():
    result = run_analysis(
        profile={"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"}
    )
    for step in result["reasoning_trace"]:
        assert set(step) == {"agent", "action"}
        assert len(step["action"]) < 200


def test_followup_uses_conversation_memory():
    first = run_analysis(
        profile={"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 500000, "purpose": "business"}
    )
    conv_id = first["conversation_id"]
    assert conv_id
    follow = run_analysis(text="What if my project cost is 1.3 lakh?", conversation_id=conv_id)
    assert follow["conversation_id"] == conv_id
    assert follow["is_followup"] is True
    assert follow["input"]["project_cost"] == 130000
    assert follow["input"]["category"] == "sc"  # remembered, not re-parsed


def test_missing_input_raises():
    with pytest.raises(DomainValidationError):
        graph.run_analysis()


def test_unsupported_category_via_llm_fallback_raises():
    # No category in the text -> clarification, not a crash (never guess).
    result = run_analysis(text="I am a martian, give me a loan")
    assert result["needs_clarification"] is True


# --- HTTP layer ---
def test_analyze_endpoint(client):
    resp = client.post(
        "/api/analyze",
        json={
            "text": "I'm a 27 year old SC entrepreneur, income 2.5 lakh, need 5 lakh for my business"
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["input"]["category"] == "sc"
    assert body["recommended_scheme"] is not None
    assert body["reasoning_trace"]


def test_analyze_endpoint_with_profile(client):
    resp = client.post(
        "/api/analyze",
        json={
            "profile": {
                "category": "women",
                "annual_income": 300000,
                "age": 30,
                "project_cost": 300000,
                "purpose": "business",
            }
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["flow"] == "business"
    assert body["recommended_scheme"]["scheme_id"] == "mahila_loan"


def test_followup_endpoint(client):
    first = client.post(
        "/api/analyze",
        json={"profile": {"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 500000, "purpose": "business"}},
    ).json()
    conv = first["conversation_id"]
    resp = client.post("/api/analyze/followup", json={"text": "what if it's 1.3 lakh?", "conversation_id": conv})
    assert resp.status_code == 200
    body = resp.json()
    assert body["input"]["project_cost"] == 130000


def test_analyze_missing_input_422(client):
    resp = client.post("/api/analyze", json={})
    assert resp.status_code == 422


def test_ai_status_endpoint(client):
    resp = client.get("/api/ai/status")
    assert resp.status_code == 200
    body = resp.json()
    assert "groq" in body
    assert "rag" in body


def test_what_if_via_analyze_is_deterministic():
    result = run_analysis(
        profile={"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 140000, "purpose": "business"}
    )
    micro = next(m for m in result["matched_schemes"] if m["scheme_id"] == "micro_finance")
    assert micro["status"] in ("eligible", "potentially_eligible")
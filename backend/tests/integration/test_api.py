"""API integration tests — Phase 1 endpoints."""

from __future__ import annotations

import pytest


# --- /api/schemes/match ---
def test_match_returns_structured_response(client):
    resp = client.post(
        "/api/schemes/match",
        json={
            "category": "sc",
            "annual_income": 250000,
            "age": 27,
            "project_cost": 500000,
            "purpose": "business",
            "is_education": False,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["input"]["category"] == "sc"
    assert body["matched_schemes"]
    assert body["recommended_scheme"] is not None
    assert body["emi"] is not None
    assert body["partners"]
    assert body["reasoning_trace"]
    assert body["is_demo_data"] is True


def test_match_recommendation_meets_eligibility(client):
    resp = client.post(
        "/api/schemes/match",
        json={"category": "sc", "annual_income": 200000, "age": 27, "project_cost": 100000, "purpose": "business"},
    )
    rec = resp.json()["recommended_scheme"]
    assert rec["status"] in ("eligible", "potentially_eligible")
    assert rec["score"] >= 75


def test_match_zero_eligible_schemes_still_200(client):
    resp = client.post(
        "/api/schemes/match",
        json={"category": "general", "annual_income": 200000, "age": 70, "project_cost": 3000000, "purpose": "business"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert all(m["status"] == "not_eligible" for m in body["matched_schemes"])
    assert body["recommended_scheme"] is None


def test_match_unsupported_category_422(client):
    resp = client.post(
        "/api/schemes/match",
        json={"category": "vampire", "annual_income": 100000, "age": 30, "project_cost": 50000},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "UNSUPPORTED_CATEGORY"


def test_match_negative_project_cost_422(client):
    resp = client.post(
        "/api/schemes/match",
        json={"category": "sc", "annual_income": 100000, "age": 30, "project_cost": -500},
    )
    assert resp.status_code == 422
    assert "error" in resp.json()


def test_match_missing_information_insufficient(client):
    resp = client.post(
        "/api/schemes/match",
        json={"category": "sc", "age": 30, "project_cost": 50000},
    )
    body = resp.json()
    # Income missing -> engine reports insufficient_information rather than guessing.
    assert any(m["status"] == "insufficient_information" for m in body["matched_schemes"])


# --- /api/calculator/emi ---
def test_emi_endpoint_returns_expected_numbers(client):
    resp = client.post(
        "/api/calculator/emi",
        json={
            "principal": 126000,
            "annual_interest_rate": 0.065,
            "tenure_years": 3,
            "moratorium_months": 3,
            "moratorium_policy": "interest_accrues",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["monthly_emi"] > 0
    assert body["total_payment"] == pytest.approx(body["monthly_emi"] * body["repayment_months"], abs=0.5)
    assert body["total_interest"] >= 0


def test_emi_zero_interest(client):
    resp = client.post(
        "/api/calculator/emi",
        json={"principal": 120000, "annual_interest_rate": 0.0, "tenure_years": 2},
    )
    assert resp.status_code == 200
    assert resp.json()["monthly_emi"] == pytest.approx(5000, abs=0.01)


def test_emi_invalid_principal_422(client):
    resp = client.post(
        "/api/calculator/emi",
        json={"principal": -100, "annual_interest_rate": 0.05, "tenure_years": 3},
    )
    assert resp.status_code == 422
    assert "error" in resp.json()


# --- /api/partners/match ---
def test_partners_match_excludes_npa(client):
    resp = client.post(
        "/api/partners/match",
        json={"scheme_id": "micro_finance", "category": "sc", "city": "Pune", "limit": 20},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["partners"]
    assert all(not p["npa_flag"] for p in body["partners"])
    assert body["npa_excluded"] >= 1


def test_partners_match_empty_for_unknown_scheme(client):
    resp = client.post("/api/partners/match", json={"scheme_id": "nope"})
    assert resp.status_code == 200
    assert resp.json()["partners"] == []


# --- Health & error contract ---
def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_error_shape_is_structured(client):
    resp = client.post("/api/calculator/emi", json={"principal": 0})
    assert resp.status_code == 422
    assert set(resp.json()["error"]) == {"code", "message"}


def test_unknown_route_is_404(client):
    resp = client.get("/api/does-not-exist")
    assert resp.status_code == 404


# --- What-if (deterministic simulator backend) ---
def test_what_if_changes_eligibility(client):
    base = {
        "category": "sc",
        "annual_income": 200000,
        "age": 30,
        "project_cost": 140001,  # just above micro_finance cap
        "purpose": "business",
    }
    below = client.post("/api/schemes/match", json=base)
    rec_below = below.json()["recommended_scheme"]
    assert rec_below["scheme_id"] != "micro_finance" or rec_below["status"] == "not_eligible"

    what_if = client.post(
        "/api/schemes/what-if",
        json={**base, "project_cost": 140000},
    )
    body = what_if.json()
    micro = next(m for m in body["results"] if m["scheme_id"] == "micro_finance")
    assert micro["status"] in ("eligible", "potentially_eligible")
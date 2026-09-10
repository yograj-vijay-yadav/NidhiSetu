"""Phase 4 integration tests: auth + applications + readiness."""

from __future__ import annotations

import pytest

from app.database import reset_store
from app.services.application_service import ALLOWED_TRANSITIONS, validate_transition
from app.utils.errors import DomainValidationError


@pytest.fixture(autouse=True)
def fresh_store():
    reset_store()
    yield
    reset_store()


def _demo_token(client) -> str:
    resp = client.post("/api/auth/demo/login", json={})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _analysis_payload() -> dict:
    return {
        "category": "sc",
        "annual_income": 250000,
        "age": 27,
        "project_cost": 500000,
        "purpose": "business",
        "is_education": False,
    }


# --- Auth ---
def test_demo_login_returns_token_and_user(client):
    resp = client.post("/api/auth/demo/login", json={"name": "Ramesh"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["name"] == "Ramesh"
    assert body["user"]["role"] == "user"


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_token(client):
    token = _demo_token(client)
    resp = client.get("/api/auth/me", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["email"]


def test_invalid_token_401(client):
    resp = client.get("/api/auth/me", headers=_auth("not-a-token"))
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"


def test_demo_admin_login_gets_admin_role(client):
    resp = client.post("/api/auth/demo/admin-login", json={})
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "admin"


# --- Applications ---
def test_create_application_from_analysis(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    resp = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "analysis_completed"
    assert body["recommended_scheme"] is not None
    assert body["readiness"]["score"] >= 0
    assert body["readiness"]["breakdown"]["scheme_match"] == 100
    assert body["requested_amount"] is not None


def test_create_application_requires_auth(client):
    resp = client.post("/api/applications", json={"analysis": {}})
    assert resp.status_code == 401


def test_list_and_get_own_applications(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    created = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token)).json()
    listed = client.get("/api/applications", headers=_auth(token)).json()
    assert len(listed) == 1
    got = client.get(f"/api/applications/{created['id']}", headers=_auth(token)).json()
    assert got["id"] == created["id"]


def test_cannot_access_another_users_application(client):
    token_a = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    created = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token_a)).json()
    # second user
    resp_b = client.post("/api/auth/demo/login", json={"email": "other@example.com"})
    token_b = resp_b.json()["access_token"]
    resp = client.get(f"/api/applications/{created['id']}", headers=_auth(token_b))
    assert resp.status_code == 403


def test_unknown_application_404(client):
    token = _demo_token(client)
    resp = client.get("/api/applications/does-not-exist", headers=_auth(token))
    assert resp.status_code == 404


# --- Status state machine ---
def test_valid_status_transitions(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    app_id = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token)).json()["id"]

    flow = ["ready_to_apply", "application_started", "documents_submitted", "under_review", "approved"]
    for target in flow:
        resp = client.patch(
            f"/api/applications/{app_id}/status", json={"status": target}, headers=_auth(token)
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == target

    detail = client.get(f"/api/applications/{app_id}", headers=_auth(token)).json()
    assert len(detail["status_history"]) == 6  # analysis_completed + 5 updates


def test_invalid_status_transition_422(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    app_id = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token)).json()["id"]
    resp = client.patch(
        f"/api/applications/{app_id}/status",
        json={"status": "approved"},
        headers=_auth(token),
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


def test_transition_rules_are_strict():
    validate_transition("analysis_completed", "ready_to_apply")  # ok
    with pytest.raises(DomainValidationError):
        validate_transition("analysis_completed", "approved")  # skipping steps
    with pytest.raises(DomainValidationError):
        validate_transition("approved", "under_review")  # no backwards moves


# --- Documents + readiness ---
def test_documents_update_recomputes_readiness(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    app_id = client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token)).json()["id"]

    before = client.get(f"/api/applications/{app_id}", headers=_auth(token)).json()
    assert before["readiness"]["breakdown"]["documents"] == 0

    docs = ["identity_proof", "address_proof", "category_certificate", "income_certificate", "bank_details", "project_report"]
    resp = client.patch(
        f"/api/applications/{app_id}/documents", json={"documents": docs}, headers=_auth(token)
    )
    assert resp.status_code == 200
    after = resp.json()
    assert after["readiness"]["breakdown"]["documents"] == 100
    assert after["readiness"]["score"] > before["readiness"]["score"]


# --- Admin ---
def test_admin_reingest_allowed_for_admin(client):
    token = client.post("/api/auth/demo/admin-login", json={}).json()["access_token"]
    resp = client.post("/api/admin/schemes/reingest", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["indexed_documents"] > 0


def test_admin_reingest_forbidden_for_regular_user(client):
    token = _demo_token(client)
    resp = client.post("/api/admin/schemes/reingest", headers=_auth(token))
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_admin_reingest_requires_auth(client):
    resp = client.post("/api/admin/schemes/reingest")
    assert resp.status_code == 401


# --- Dashboard (Phase 5) ---
def test_user_dashboard_reflects_applications(client):
    token = _demo_token(client)
    analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
    client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token))
    resp = client.get("/api/dashboard/me", headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_applications"] == 1
    assert body["potentially_eligible"] >= 1
    assert body["total_requested_amount"] > 0
    assert body["scheme_distribution"]
    assert body["applications_by_month"]


def test_dashboard_requires_auth(client):
    assert client.get("/api/dashboard/me").status_code == 401


def test_admin_analytics_aggregates_all_users(client):
    admin_token = client.post("/api/auth/demo/admin-login", json={}).json()["access_token"]
    # two regular users create applications
    for email in ("u1@example.com", "u2@example.com"):
        token = client.post("/api/auth/demo/login", json={"email": email}).json()["access_token"]
        analysis = client.post("/api/analyze", json={"profile": _analysis_payload()}).json()
        client.post("/api/applications", json={"analysis": analysis}, headers=_auth(token))
    resp = client.get("/api/dashboard/admin/analytics", headers=_auth(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_applications"] == 2
    assert body["total_users"] == 3  # 2 demo users + 1 demo admin
    assert body["popular_scheme"]
    assert body["average_requested_amount"] > 0


def test_admin_analytics_forbidden_for_user(client):
    token = _demo_token(client)
    resp = client.get("/api/dashboard/admin/analytics", headers=_auth(token))
    assert resp.status_code == 403
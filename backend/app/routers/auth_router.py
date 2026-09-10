"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse

from app.controllers import auth_controller
from app.auth.dependencies import get_current_user
from app.schemas.auth import DemoLoginRequest, GoogleLoginStatus, TokenResponse

router = APIRouter()


@router.get(
    "/google/status",
    response_model=GoogleLoginStatus,
    summary="Google OAuth configuration status",
)
def google_status() -> GoogleLoginStatus:
    return auth_controller.login_status()


@router.get(
    "/google/login",
    summary="Start Google OAuth flow",
    responses={302: {"description": "Redirect to Google consent screen"}},
)
def google_login() -> RedirectResponse:
    return auth_controller.google_authorize()


@router.get(
    "/google/callback",
    summary="Google OAuth callback",
    description="Exchanges the code for a JWT and redirects to "
    "{frontend_url}/auth/callback?token=...",
    include_in_schema=True,
)
async def google_callback(
    code: str = Query(...),
    state: str | None = Query(default=None),
) -> RedirectResponse:
    return await auth_controller.google_callback(code, state)


@router.post(
    "/demo/login",
    response_model=TokenResponse,
    summary="Demo login (DEMO_MODE only)",
    description=(
        "Creates/finds the demo user and issues a real JWT. Enabled only when "
        "DEMO_MODE=true — never silently fakes production authentication."
    ),
)
def demo_login(request: DemoLoginRequest) -> TokenResponse:
    return auth_controller.demo_login(request)


@router.post(
    "/demo/admin-login",
    response_model=TokenResponse,
    summary="Demo admin login (DEMO_MODE only)",
)
def demo_admin_login() -> TokenResponse:
    return auth_controller.demo_admin_login()


@router.get(
    "/me",
    response_model=None,
    summary="Current user",
    dependencies=[],
)
def me(current_user=Depends(get_current_user)) -> dict:
    return auth_controller.me(current_user)
"""Auth controller."""

from __future__ import annotations

from typing import Any

from fastapi.responses import RedirectResponse

from app.auth import oauth
from app.auth.jwt_handler import create_access_token
from app.config import settings
from app.schemas.auth import DemoLoginRequest, GoogleLoginStatus, TokenResponse
from app.services import user_service
from app.utils.errors import ForbiddenError
from app.utils.logging import get_logger
from app.utils.security import generate_request_id

logger = get_logger(__name__)


def login_status() -> GoogleLoginStatus:
    state = generate_request_id()
    return GoogleLoginStatus(
        configured=oauth.google_configured(),
        demo_mode=settings.demo_mode,
        authorize_url=oauth.build_google_authorize_url(state) if oauth.google_configured() else None,
    )


def google_authorize() -> RedirectResponse:
    state = generate_request_id()
    url = oauth.build_google_authorize_url(state)
    return RedirectResponse(url)


async def google_callback(code: str, state: str | None = None) -> RedirectResponse:
    """Exchange code -> user -> JWT -> redirect to frontend with token."""
    profile = await oauth.exchange_google_code(code)
    user = user_service.login_via_google(
        email=profile["email"],
        name=profile["name"],
        google_provider_id=profile["google_provider_id"],
    )
    token = create_access_token(user)
    redirect = f"{settings.frontend_url}/auth/callback?token={token}"
    return RedirectResponse(redirect)


def demo_login(request: DemoLoginRequest) -> TokenResponse:
    user = oauth.demo_login(name=request.name, email=request.email, role="user")
    return TokenResponse(
        access_token=create_access_token(user),
        expires_in=settings.jwt_expire_minutes * 60,
        user=user_service.public_user(user),
    )


def demo_admin_login() -> TokenResponse:
    user = oauth.demo_admin_login()
    return TokenResponse(
        access_token=create_access_token(user),
        expires_in=settings.jwt_expire_minutes * 60,
        user=user_service.public_user(user),
    )


def me(current_user: dict[str, Any]) -> dict[str, Any]:
    return user_service.public_user(current_user)
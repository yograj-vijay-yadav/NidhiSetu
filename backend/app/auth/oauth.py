"""Authentication flows.

1. Google OAuth 2.0 (Authlib) — used when GOOGLE_CLIENT_ID/SECRET are set.
   Flow: /api/auth/google/login -> Google consent -> callback exchanges the
   code, fetches profile, finds-or-creates the user, issues a JWT, redirects
   to `{frontend_url}/auth/callback?token=...`.

2. Demo login (only when DEMO_MODE=true) — explicit, clearly labelled, for
   local demos without Google credentials. Never silently fakes real
   authentication: demo tokens carry the same role model but the user is
   clearly a demo identity.
"""

from __future__ import annotations

from typing import Any

from app.config import settings
from app.models.user import find_or_create_user
from app.utils.errors import ForbiddenError


def google_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def build_google_authorize_url(state: str) -> str:
    """Build the Google authorization URL (Authlib-compatible request params)."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    from urllib.parse import urlencode

    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)


async def exchange_google_code(code: str) -> dict[str, str]:
    """Exchange the OAuth code for the Google profile (name, email, sub)."""
    import httpx

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(token_url, data=token_data)
        if resp.status_code != 200:
            raise ForbiddenError("Google rejected the authorization code.")
        tokens = resp.json()
        profile_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if profile_resp.status_code != 200:
            raise ForbiddenError("Could not fetch Google profile.")
        profile = profile_resp.json()
    return {
        "email": profile.get("email", ""),
        "name": profile.get("name", ""),
        "google_provider_id": str(profile.get("id", "")),
    }


def demo_login(name: str | None = None, email: str | None = None, role: str = "user") -> dict[str, Any]:
    """Explicit demo login. Only allowed when DEMO_MODE=true."""
    if not settings.demo_mode:
        raise ForbiddenError("Demo login is disabled; use Google OAuth.")
    final_email = (email or settings.demo_login_email).strip().lower()
    final_name = name or settings.demo_login_name
    return find_or_create_user(
        email=final_email,
        name=final_name,
        google_provider_id=None,
        role=role,
    )


def demo_admin_login() -> dict[str, Any]:
    """Explicit demo admin login (demo mode only)."""
    if not settings.demo_mode:
        raise ForbiddenError("Demo login is disabled; use Google OAuth.")
    return find_or_create_user(
        email="admin@nidhisetu.local",
        name="Demo Admin",
        google_provider_id=None,
        role="admin",
    )
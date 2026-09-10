"""Pydantic schemas for authentication."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DemoLoginRequest(BaseModel):
    name: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=120)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str


class GoogleLoginStatus(BaseModel):
    configured: bool
    demo_mode: bool
    authorize_url: str | None = None


TokenResponse.model_rebuild()
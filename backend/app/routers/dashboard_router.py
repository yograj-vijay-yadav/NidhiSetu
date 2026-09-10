"""Dashboard endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_admin
from app.schemas.dashboard import AdminAnalytics, DashboardStats
from app.services.dashboard_service import admin_analytics, user_dashboard

router = APIRouter()


@router.get(
    "/me",
    response_model=DashboardStats,
    summary="My dashboard statistics",
    description="Aggregates over the current user's own applications only.",
)
def my_dashboard(user=Depends(get_current_user)) -> dict:
    return user_dashboard(user["_id"])


@router.get(
    "/admin/analytics",
    response_model=AdminAnalytics,
    summary="National-level analytics (admin only)",
    description="Aggregates over ALL users. Private application details are never exposed.",
)
def analytics(_=Depends(require_admin)) -> dict:
    return admin_analytics()
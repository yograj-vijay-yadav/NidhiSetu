"""Pydantic schemas for dashboard analytics."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class MonthPoint(BaseModel):
    month: str  # "2026-01"
    count: int


class DashboardStats(BaseModel):
    total_applications: int
    total_analyses: int
    potentially_eligible: int
    total_requested_amount: float
    average_requested_amount: float
    most_matched_scheme: str | None = None
    applications_by_month: list[MonthPoint]
    scheme_distribution: list[dict[str, Any]]
    status_distribution: list[dict[str, Any]]


class AdminAnalytics(BaseModel):
    total_users: int
    total_applications: int
    popular_category: str | None = None
    popular_scheme: str | None = None
    average_requested_amount: float
    applications_by_month: list[MonthPoint]
    status_distribution: list[dict[str, Any]]
    scheme_distribution: list[dict[str, Any]]
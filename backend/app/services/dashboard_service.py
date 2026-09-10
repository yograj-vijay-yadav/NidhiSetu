"""Dashboard & admin analytics.

Aggregations are computed in Python over the application documents (demo-scale
dataset, works identically on MongoDB and the in-memory store). Private
application data is never exposed — only aggregates leave this module.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from app.database import APPLICATIONS_COLLECTION, USERS_COLLECTION, get_store


def _month(created_at: str | None) -> str:
    return (created_at or "")[:7]


def _distributions(apps: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    by_month = Counter(_month(a.get("created_at")) for a in apps)
    by_scheme = Counter((a.get("recommended_scheme") or {}).get("scheme_name") or "None" for a in apps)
    by_status = Counter(a.get("status") or "analysis_completed" for a in apps)

    def to_list(counter: Counter) -> list[dict[str, Any]]:
        return [{"name": k, "count": v} for k, v in sorted(counter.items(), key=lambda t: -t[1])]

    return to_list(by_month), to_list(by_scheme), to_list(by_status)


def user_dashboard(user_id: str) -> dict[str, Any]:
    store = get_store()
    apps = store.find(APPLICATIONS_COLLECTION, {"user_id": user_id})
    amounts = [a.get("requested_amount") for a in apps if a.get("requested_amount") is not None]
    eligible = sum(
        1
        for a in apps
        if (a.get("recommended_scheme") or {}).get("status") in ("eligible", "potentially_eligible")
    )
    by_month, by_scheme, by_status = _distributions(apps)
    most_scheme = by_scheme[0]["name"] if by_scheme and by_scheme[0]["name"] != "None" else None
    return {
        "total_applications": len(apps),
        "total_analyses": len(apps),
        "potentially_eligible": eligible,
        "total_requested_amount": round(sum(amounts), 2),
        "average_requested_amount": round(sum(amounts) / len(amounts), 2) if amounts else 0.0,
        "most_matched_scheme": most_scheme,
        "applications_by_month": [{"month": item["name"], "count": item["count"]} for item in by_month],
        "scheme_distribution": by_scheme,
        "status_distribution": by_status,
    }


def admin_analytics() -> dict[str, Any]:
    store = get_store()
    apps = store.find(APPLICATIONS_COLLECTION)
    users_count = store.count(USERS_COLLECTION)
    amounts = [a.get("requested_amount") for a in apps if a.get("requested_amount") is not None]
    by_month, by_scheme, by_status = _distributions(apps)
    categories = Counter(a.get("category") or "unknown" for a in apps)
    return {
        "total_users": users_count,
        "total_applications": len(apps),
        "popular_category": categories.most_common(1)[0][0] if categories else None,
        "popular_scheme": by_scheme[0]["name"] if by_scheme and by_scheme[0]["name"] != "None" else None,
        "average_requested_amount": round(sum(amounts) / len(amounts), 2) if amounts else 0.0,
        "applications_by_month": [{"month": item["name"], "count": item["count"]} for item in by_month],
        "status_distribution": by_status,
        "scheme_distribution": by_scheme,
    }
"""Partner matching service.

Loads sample channelizing partners from data/partners_sample.json (DEMO data)
and deterministically filters/ranks them. NEVER recommends NPA-flagged or
inactive partners. No LLM involved.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from app.config import settings
from app.utils.errors import DomainValidationError

DATA_PATH = settings.partners_file


@lru_cache(maxsize=4)
def _load_partners(path_str: str) -> tuple[dict[str, Any], ...]:
    try:
        with open(path_str, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError as exc:
        raise DomainValidationError(
            "PARTNER_DATA_MISSING", "Partner data file is missing on the server."
        ) from exc
    except json.JSONDecodeError as exc:
        raise DomainValidationError(
            "PARTNER_DATA_INVALID", "Partner data file is not valid JSON."
        ) from exc
    if not isinstance(data, list):
        raise DomainValidationError("PARTNER_DATA_INVALID", "Partner data must be a list.")
    return tuple(data)


def _partners() -> list[dict[str, Any]]:
    return [dict(p) for p in _load_partners(str(DATA_PATH))]


def list_partners() -> list[dict[str, Any]]:
    return _partners()


def match_partners(
    scheme_id: str | None = None,
    category: str | None = None,
    city: str | None = None,
    max_distance_km: float | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Filter + rank partners.

    Hard filters: active, not NPA-flagged.
    Soft scoring: scheme compatibility, category match, distance.
    """
    partners = _partners()

    # Hard filters — never recommend NPA-flagged or inactive partners.
    partners = [p for p in partners if p.get("is_active", True) and not p.get("npa_flag", False)]

    scored: list[tuple[float, dict[str, Any]]] = []
    for p in partners:
        scheme_ok = (not scheme_id) or (scheme_id in p.get("schemes", []))
        category_ok = (not category) or (category.lower() in p.get("categories", []))
        city_ok = (not city) or (p.get("city", "").lower() == city.strip().lower())

        if scheme_id and not scheme_ok:
            continue
        if category and not category_ok:
            continue
        if city and not city_ok:
            continue
        distance = float(p.get("distance_km", 0))
        if max_distance_km is not None and distance > max_distance_km:
            continue

        score = 50.0
        if scheme_ok and scheme_id:
            score += 30
        if category_ok and category:
            score += 10
        if city_ok and city:
            score += 5
        score += max(0.0, 5 - distance / 10)  # closer is slightly better

        p = {**p, "match_score": round(score, 1)}
        scored.append((score, p))

    scored.sort(key=lambda t: (-t[0], t[1].get("distance_km", 0), t[1].get("id", "")))
    return [p for _, p in scored[: max(1, limit)]]

"""Scheme matching controller: thin bridge between router and service."""

from __future__ import annotations

from typing import Any

from app.schemas.scheme import SchemeMatchRequest, SchemeMatchResponse, SchemeSummary
from app.services import scheme_service
from app.rules.scheme_rules import list_all_schemes


def handle_scheme_match(request: SchemeMatchRequest) -> SchemeMatchResponse:
    return SchemeMatchResponse(**scheme_service.match_schemes(request.model_dump()))


def handle_list_schemes() -> list[SchemeSummary]:
    """Public catalogue of all configured schemes (demo corpus)."""
    return [SchemeSummary(**rule.to_public_dict()) for rule in list_all_schemes()]


def handle_what_if(request: SchemeMatchRequest, overrides: dict[str, Any]) -> dict[str, Any]:
    """Deterministic what-if: same engine, overridden profile values."""
    base = scheme_service.normalize_profile(request.model_dump())
    from app.services.eligibility_service import build_what_if

    return build_what_if(base, overrides)

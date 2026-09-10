"""Partner controller: thin bridge between router and matching service."""

from __future__ import annotations

from app.schemas.partner import PartnerMatchRequest, PartnerMatchResponse
from app.services import partner_service


def handle_partner_match(request: PartnerMatchRequest) -> PartnerMatchResponse:
    all_partners = partner_service.list_partners()
    matched = partner_service.match_partners(
        scheme_id=request.scheme_id,
        category=request.category,
        city=request.city,
        max_distance_km=request.max_distance_km,
        limit=request.limit,
    )
    npa_excluded = sum(1 for p in all_partners if p.get("npa_flag"))
    inactive_excluded = sum(1 for p in all_partners if not p.get("is_active", True))
    return PartnerMatchResponse(
        partners=matched,
        total_found=len(matched),
        npa_excluded=npa_excluded,
        inactive_excluded=inactive_excluded,
    )

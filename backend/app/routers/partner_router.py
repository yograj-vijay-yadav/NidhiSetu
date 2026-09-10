"""Partner endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.controllers import partner_controller
from app.schemas.partner import PartnerMatchRequest, PartnerMatchResponse

router = APIRouter()


@router.post(
    "/match",
    response_model=PartnerMatchResponse,
    summary="Match authorized channelizing partners",
    description=(
        "Deterministic partner matching by scheme, category and city. NPA-flagged and "
        "inactive partners are NEVER recommended."
    ),
    responses={200: {"description": "Partner list (may be empty)"}},
)
def match_partners(request: PartnerMatchRequest) -> PartnerMatchResponse:
    return partner_controller.handle_partner_match(request)

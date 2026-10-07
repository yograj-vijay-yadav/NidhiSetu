from fastapi import APIRouter
from app.schemas.partner_schema import PartnerListResponse
from app.controllers.partner_controller import handle_partner_request

router = APIRouter()

@router.get("/nearby", response_model=PartnerListResponse)
def nearby_partners_endpoint(scheme_type: str = None):
    return handle_partner_request(scheme_type)
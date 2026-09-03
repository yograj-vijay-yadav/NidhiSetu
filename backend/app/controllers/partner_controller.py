from app.services.partner_service import get_nearby_partners

def handle_partner_request(scheme_type: str = None):
    return {"partners": get_nearby_partners(scheme_type)}
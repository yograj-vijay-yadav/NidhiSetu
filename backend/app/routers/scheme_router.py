from fastapi import APIRouter
from app.schemas.scheme_schema import SchemeRequest, SchemeResponse
from app.controllers.scheme_controller import handle_scheme_request

router = APIRouter()

@router.post("/match", response_model=SchemeResponse)
def match_scheme_endpoint(request: SchemeRequest):
    return handle_scheme_request(request)
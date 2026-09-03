from fastapi import APIRouter
from app.schemas.calculator_schema import CalculatorRequest, CalculatorResponse
from app.controllers.calculator_controller import handle_calculator_request

router = APIRouter()

@router.post("/calculate", response_model=CalculatorResponse)
def calculate_endpoint(request: CalculatorRequest):
    return handle_calculator_request(request)
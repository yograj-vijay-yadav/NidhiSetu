from pydantic import BaseModel

class CalculatorRequest(BaseModel):
    project_cost: float
    interest_rate: float
    tenure_years: int
    loan_percent: int = 90

class CalculatorResponse(BaseModel):
    loan_amount: float
    monthly_emi: float
    total_payment: float
    total_interest: float
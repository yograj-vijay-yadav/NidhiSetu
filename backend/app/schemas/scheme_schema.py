from pydantic import BaseModel
from typing import Optional

class SchemeRequest(BaseModel):
    income: float
    project_cost: float
    margin_capital: float
    is_education: bool = False
    location: Optional[str] = None

class SchemeResponse(BaseModel):
    scheme_name: str
    max_loan_percent: int
    interest_rate: float
    tenure_years: int
    moratorium_months: int
    loan_amount: float
    explanation: str
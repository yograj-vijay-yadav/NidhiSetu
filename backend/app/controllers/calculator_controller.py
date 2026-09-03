from app.services.calculator_service import calculate_emi

def handle_calculator_request(data):
    return calculate_emi(
        project_cost=data.project_cost,
        interest_rate=data.interest_rate,
        tenure_years=data.tenure_years,
        loan_percent=data.loan_percent,
    )
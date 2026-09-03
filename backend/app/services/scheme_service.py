from app.services.eligibility_service import check_eligibility
from app.services.calculator_service import calculate_emi
from app.ai.explanation_agent import generate_explanation


def get_scheme_recommendation(income: float, project_cost: float, margin_capital: float, is_education: bool):
    scheme = check_eligibility(income, project_cost, is_education)

    if scheme is None:
        return {
            "scheme_name": "Not Eligible",
            "max_loan_percent": 0,
            "interest_rate": 0,
            "tenure_years": 0,
            "moratorium_months": 0,
            "loan_amount": 0,
            "explanation": "Based on the details provided, you do not currently qualify for any listed scheme. Please check income limits or consult your nearest channel partner."
        }

    calc = calculate_emi(project_cost, scheme["interest_rate"], scheme["tenure_years"], scheme["max_loan_percent"])
    explanation = generate_explanation(scheme["name"], income, project_cost, calc["loan_amount"])

    return {
        "scheme_name": scheme["name"],
        "max_loan_percent": scheme["max_loan_percent"],
        "interest_rate": scheme["interest_rate"],
        "tenure_years": scheme["tenure_years"],
        "moratorium_months": scheme["moratorium_months"],
        "loan_amount": calc["loan_amount"],
        "explanation": explanation,
    }
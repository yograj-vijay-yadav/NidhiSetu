SCHEMES = {
    "micro_finance": {
        "name": "Micro Finance Scheme",
        "max_project_cost": 140000,
        "max_loan_percent": 90,
        "interest_rate": 6.5,
        "tenure_years": 3,
        "moratorium_months": 3,
    },
    "term_loan": {
        "name": "Term Loan Scheme",
        "max_project_cost": 5000000,
        "max_loan_percent": 90,
        "interest_rate": 8.0,
        "tenure_years": 7,
        "moratorium_months": 6,
    },
    "educational_loan": {
        "name": "Educational Loan Scheme",
        "max_project_cost": 2000000,
        "max_loan_percent": 90,
        "interest_rate": 6.5,
        "tenure_years": 10,
        "moratorium_months": 12,
    },
}

MAX_ANNUAL_INCOME = 500000


def match_scheme(income: float, project_cost: float, is_education: bool):
    if income > MAX_ANNUAL_INCOME:
        return None

    if is_education:
        return SCHEMES["educational_loan"]

    if project_cost <= SCHEMES["micro_finance"]["max_project_cost"]:
        return SCHEMES["micro_finance"]

    if project_cost <= SCHEMES["term_loan"]["max_project_cost"]:
        return SCHEMES["term_loan"]

    return None
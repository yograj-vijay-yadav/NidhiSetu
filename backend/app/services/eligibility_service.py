from app.rules.scheme_rules import match_scheme

def check_eligibility(income: float, project_cost: float, is_education: bool):
    return match_scheme(income, project_cost, is_education)
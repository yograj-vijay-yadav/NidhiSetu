from app.services.scheme_service import get_scheme_recommendation

def handle_scheme_request(data):
    return get_scheme_recommendation(
        income=data.income,
        project_cost=data.project_cost,
        margin_capital=data.margin_capital,
        is_education=data.is_education,
    )
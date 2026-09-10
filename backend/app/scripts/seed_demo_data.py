"""Seed a complete demo scenario (Phase 4/5 showcase).

Usage:
    python -m app.scripts.seed_demo_data

Creates:
- a demo beneficiary user + a demo admin
- several applications across categories/schemes/statuses/months so the
  dashboard charts and application timeline are demonstrable immediately.

Uses the same persistence layer as the API (Mongo if configured, in-memory
demo store otherwise).
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone

from app.database import get_store
from app.models.user import find_or_create_user
from app.rules.scheme_rules import get_scheme_by_id
from app.services import application_service, eligibility_service, calculator_service
from app.utils.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)

SCENARIOS = [
    # (category, income, age, cost, purpose, is_education, status_index, months_ago, documents_ratio)
    ("sc", 250000, 27, 500000, "business", False, 0, 4, 1.0),      # analysis_completed
    ("sc", 200000, 30, 100000, "business", False, 1, 3, 1.0),      # ready_to_apply
    ("obc", 250000, 22, 400000, "education", True, 2, 2, 0.8),     # application_started
    ("women", 300000, 32, 300000, "business", False, 3, 2, 0.6),   # documents_submitted
    ("minority", 180000, 28, 140000, "business", False, 4, 1, 1.0),# under_review
    ("st", 150000, 26, 100000, "business", False, 5, 1, 1.0),      # approved
    ("general", 400000, 35, 800000, "business", False, 6, 0, 1.0), # rejected
    ("sc", 260000, 24, 200000, "skill_development", True, 2, 5, 0.5),
]

STATUSES = [
    application_service.STATUS_ANALYSIS_COMPLETED,
    application_service.STATUS_READY_TO_APPLY,
    application_service.STATUS_APPLICATION_STARTED,
    application_service.STATUS_DOCUMENTS_SUBMITTED,
    application_service.STATUS_UNDER_REVIEW,
    application_service.STATUS_APPROVED,
    application_service.STATUS_REJECTED,
]


def _analysis_for(scenario: tuple) -> dict:
    category, income, age, cost, purpose, is_education, _, _, _ = scenario
    results = eligibility_service.evaluate_all_schemes(
        category=category,
        annual_income=income,
        age=age,
        project_cost=cost if not is_education else None,
        education_cost=cost if is_education else None,
        purpose=purpose,
        is_education=is_education,
    )
    recommended = eligibility_service.best_scheme(results)
    emi = None
    if recommended:
        rule = get_scheme_by_id(recommended["scheme_id"])
        financing = calculator_service.scheme_financing(
            project_cost=float(cost),
            loan_percentage=rule.loan_percentage,
            max_loan_amount=rule.max_loan_amount,
        )
        emi = calculator_service.calculate_emi(
            principal=financing["loan_amount"],
            annual_interest_rate=rule.interest_rate,
            tenure_years=rule.tenure_years,
            moratorium_months=rule.moratorium_months,
            moratorium_policy=rule.moratorium_policy,
        )
    return {
        "input": {
            "category": category,
            "annual_income": income,
            "age": age,
            "project_cost": cost if not is_education else None,
            "education_cost": cost if is_education else None,
            "purpose": purpose,
            "is_education": is_education,
        },
        "matched_schemes": results,
        "recommended_scheme": recommended,
        "emi": emi,
        "partners": [],
        "citations": [],
        "explanation": "Seeded demo analysis.",
    }


def main() -> int:
    store = get_store()
    beneficiary = find_or_create_user(
        email="demo@nidhisetu.local", name="Demo Beneficiary", role="user"
    )
    admin = find_or_create_user(email="admin@nidhisetu.local", name="Demo Admin", role="admin")
    logger.info("Seeding applications for %s ...", beneficiary["email"])

    now = datetime.now(timezone.utc)
    for scenario in SCENARIOS:
        category, income, age, cost, purpose, is_education, status_idx, months_ago, doc_ratio = scenario
        analysis = _analysis_for(scenario)
        app = application_service.build_application(beneficiary["_id"], analysis)
        status = STATUSES[status_idx]
        created_at = (now - timedelta(days=30 * months_ago)).isoformat()

        doc_keys = [
            "identity_proof",
            "address_proof",
            "category_certificate",
            "income_certificate",
            "bank_details",
        ]
        if is_education:
            doc_keys.append("admission_letter")
        else:
            doc_keys.append("project_report")
        kept = int(round(len(doc_keys) * doc_ratio))
        documents = doc_keys[:kept]

        from app.services.readiness_service import compute_readiness

        app["readiness"] = compute_readiness(
            status=(app.get("recommended_scheme") or {}).get("status"),
            inputs=app["input"],
            recommended=app.get("recommended_scheme"),
            scheme_id=app.get("scheme_id"),
            category=category,
            documents=documents,
        )
        app["documents"] = documents
        app["status"] = status
        app["status_history"] = [
            {"status": s, "at": created_at, "note": "Seeded"}
            for s in STATUSES[: status_idx + 1]
        ]
        app["created_at"] = created_at
        app["updated_at"] = created_at

        store.insert_one(application_service.APPLICATIONS_COLLECTION, app)

    logger.info("Seeded %d applications (+admin %s).", len(SCENARIOS), admin["email"])
    print({"seeded_applications": len(SCENARIOS), "beneficiary": beneficiary["email"]})
    return 0


if __name__ == "__main__":
    sys.exit(main())
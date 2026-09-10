"""Application Readiness Score (deterministic).

Weights (documented in README):
- Eligibility         25%
- Required information 20%
- Documents           20%
- Scheme match        15%
- Partner availability 20%

Every component is computed from deterministic facts; no LLM involved. The
breakdown is returned to the UI so applicants see exactly what to improve.
"""

from __future__ import annotations

from typing import Any

from app.services.partner_service import match_partners

DOCUMENT_CHECKLIST = {
    "identity_proof": "Identity proof",
    "address_proof": "Address proof",
    "category_certificate": "Category / caste certificate",
    "income_certificate": "Income certificate",
    "bank_details": "Bank account details",
    "project_report": "Project report / proposal",
    "admission_letter": "Admission letter / fee structure",
}

REQUIRED_DOCUMENTS_BASE = ("identity_proof", "address_proof", "category_certificate", "income_certificate", "bank_details")


def _eligibility_component(status: str | None) -> float:
    mapping = {
        "eligible": 1.0,
        "potentially_eligible": 0.75,
        "insufficient_information": 0.4,
        "not_eligible": 0.0,
    }
    return mapping.get(status or "", 0.0)


def _information_component(inputs: dict[str, Any]) -> float:
    fields = ["category", "annual_income", "age"]
    cost_key = "education_cost" if inputs.get("is_education") else "project_cost"
    fields.append(cost_key)
    present = sum(1 for f in fields if inputs.get(f) is not None)
    return present / len(fields)


def _documents_component(documents: list[str] | None, is_education: bool) -> float:
    docs = set(documents or [])
    required = list(REQUIRED_DOCUMENTS_BASE) + (["admission_letter"] if is_education else ["project_report"])
    if not required:
        return 1.0
    return sum(1 for d in required if d in docs) / len(required)


def _scheme_component(recommended: dict[str, Any] | None) -> float:
    return 1.0 if recommended else 0.0


def _partner_component(scheme_id: str | None, category: str | None) -> float:
    if not scheme_id:
        return 0.0
    found = match_partners(scheme_id=scheme_id, category=category, limit=5)
    if not found:
        return 0.0
    return min(1.0, 0.5 + 0.25 * len(found))


def compute_readiness(
    *,
    status: str | None,
    inputs: dict[str, Any],
    recommended: dict[str, Any] | None,
    scheme_id: str | None,
    category: str | None,
    documents: list[str] | None = None,
) -> dict[str, Any]:
    """Compute the 0-100 readiness score with a transparent breakdown."""
    is_education = bool((inputs or {}).get("is_education"))

    eligibility = _eligibility_component(status)
    information = _information_component(inputs or {})
    docs = _documents_component(documents, is_education)
    scheme_match = _scheme_component(recommended)
    partners = _partner_component(scheme_id, category)

    breakdown = {
        "eligibility": round(eligibility * 100),
        "required_information": round(information * 100),
        "documents": round(docs * 100),
        "scheme_match": round(scheme_match * 100),
        "partner_availability": round(partners * 100),
    }
    score = (
        breakdown["eligibility"] * 0.25
        + breakdown["required_information"] * 0.20
        + breakdown["documents"] * 0.20
        + breakdown["scheme_match"] * 0.15
        + breakdown["partner_availability"] * 0.20
    )
    return {"score": round(score), "breakdown": breakdown, "weights": {
        "eligibility": 0.25,
        "required_information": 0.20,
        "documents": 0.20,
        "scheme_match": 0.15,
        "partner_availability": 0.20,
    }}
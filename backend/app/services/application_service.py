"""Application persistence & tracking.

Document shape (see models/application.py). Status transitions are a
deterministic state machine — the AI never changes application status.

    analysis_completed -> ready_to_apply -> application_started ->
    documents_submitted -> under_review -> approved | rejected
"""

from __future__ import annotations

import uuid
from typing import Any

from app.database import APPLICATIONS_COLLECTION, get_store
from app.models.user import iso_now
from app.services.readiness_service import compute_readiness
from app.utils.errors import DomainValidationError, ForbiddenError, NotFoundError

STATUS_ANALYSIS_COMPLETED = "analysis_completed"
STATUS_READY_TO_APPLY = "ready_to_apply"
STATUS_APPLICATION_STARTED = "application_started"
STATUS_DOCUMENTS_SUBMITTED = "documents_submitted"
STATUS_UNDER_REVIEW = "under_review"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"

ALLOWED_TRANSITIONS: dict[str, list[str]] = {  # noqa: E501 (deterministic state machine)
    STATUS_ANALYSIS_COMPLETED: [STATUS_READY_TO_APPLY, STATUS_APPLICATION_STARTED],
    STATUS_READY_TO_APPLY: [STATUS_APPLICATION_STARTED],
    STATUS_APPLICATION_STARTED: [STATUS_DOCUMENTS_SUBMITTED],
    STATUS_DOCUMENTS_SUBMITTED: [STATUS_UNDER_REVIEW],
    STATUS_UNDER_REVIEW: [STATUS_APPROVED, STATUS_REJECTED],
    STATUS_APPROVED: [],
    STATUS_REJECTED: [],
}

def validate_transition(current: str, target: str) -> None:
    if target not in ALLOWED_TRANSITIONS.get(current, []):
        raise DomainValidationError(
            "INVALID_STATUS_TRANSITION",
            f"Cannot move application from '{current}' to '{target}'.",
        )


def build_application(user_id: str, analysis: dict[str, Any]) -> dict[str, Any]:
    """Create the stored application document from an analysis payload."""
    recommended = analysis.get("recommended_scheme")
    emi = analysis.get("emi")
    requested_amount = None
    if emi and isinstance(emi, dict):
        requested_amount = round(float(emi.get("loan_amount") or 0), 2)

    readiness = compute_readiness(
        status=recommended.get("status") if recommended else None,
        inputs=analysis.get("input") or {},
        recommended=recommended,
        scheme_id=recommended.get("scheme_id") if recommended else None,
        category=(analysis.get("input") or {}).get("category"),
    )
    now = iso_now()
    return {
        "_id": uuid.uuid4().hex,
        "user_id": user_id,
        "category": (analysis.get("input") or {}).get("category"),
        "input": analysis.get("input") or {},
        "matched_schemes": [
            {
                "scheme_id": m.get("scheme_id"),
                "scheme_name": m.get("scheme_name"),
                "status": m.get("status"),
                "score": m.get("score"),
            }
            for m in (analysis.get("matched_schemes") or [])
        ],
        "recommended_scheme": (
            {
                "scheme_id": recommended.get("scheme_id"),
                "scheme_name": recommended.get("scheme_name"),
                "status": recommended.get("status"),
                "score": recommended.get("score"),
            }
            if recommended
            else None
        ),
        "scheme_id": recommended.get("scheme_id") if recommended else None,
        "emi": emi,
        "partners": analysis.get("partners") or [],
        "citations": analysis.get("citations") or [],
        "explanation": analysis.get("explanation") or "",
        "readiness": readiness,
        "documents": [],
        "requested_amount": requested_amount,
        "status": STATUS_ANALYSIS_COMPLETED,
        "status_history": [
            {"status": STATUS_ANALYSIS_COMPLETED, "at": now, "note": "Analysis completed by NidhiSetu"}
        ],
        "conversation_id": analysis.get("conversation_id"),
        "created_at": now,
        "updated_at": now,
    }


def create_application(user_id: str, analysis: dict[str, Any]) -> dict[str, Any]:
    doc = build_application(user_id, analysis)
    get_store().insert_one(APPLICATIONS_COLLECTION, doc)
    return doc


def _public(app: dict[str, Any]) -> dict[str, Any]:
    app = dict(app)
    app["id"] = app.pop("_id", "")
    return app


def get_application(user_id: str, application_id: str) -> dict[str, Any]:
    store = get_store()
    app = store.find_one(APPLICATIONS_COLLECTION, {"_id": application_id})
    if app is None:
        raise NotFoundError("Application not found.")
    if app["user_id"] != user_id:
        raise ForbiddenError("You do not have access to this application.")
    return _public(app)


def list_applications(user_id: str) -> list[dict[str, Any]]:
    docs = get_store().find(
        APPLICATIONS_COLLECTION,
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    return [_public(d) for d in docs]


def update_status(user_id: str, application_id: str, target: str, note: str | None = None) -> dict[str, Any]:
    app = get_application(user_id, application_id)
    validate_transition(app["status"], target)
    now = iso_now()
    history = list(app.get("status_history") or [])
    history.append({"status": target, "at": now, "note": note or ""})
    get_store().update_one(
        APPLICATIONS_COLLECTION,
        {"_id": application_id},
        {"$set": {"status": target, "status_history": history, "updated_at": now}},
    )
    return get_application(user_id, application_id)


def update_documents(user_id: str, application_id: str, documents: list[str]) -> dict[str, Any]:
    app = get_application(user_id, application_id)
    now = iso_now()
    # Readiness uses the *eligibility* status (deterministic engine verdict),
    # not the workflow status (analysis_completed -> ... -> approved).
    eligibility_status = (app.get("recommended_scheme") or {}).get("status")
    readiness = compute_readiness(
        status=eligibility_status,
        inputs=app.get("input") or {},
        recommended=app.get("recommended_scheme"),
        scheme_id=app.get("scheme_id"),
        category=app.get("category"),
        documents=documents,
    )
    get_store().update_one(
        APPLICATIONS_COLLECTION,
        {"_id": application_id},
        {
            "$set": {
                "documents": documents,
                "readiness": readiness,
                "updated_at": now,
            }
        },
    )
    return get_application(user_id, application_id)


def count_applications(query: dict[str, Any] | None = None) -> int:
    return get_store().count(APPLICATIONS_COLLECTION, query)
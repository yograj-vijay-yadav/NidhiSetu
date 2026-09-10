"""Application model — documented Mongo document shape.

{
    "_id": str,
    "user_id": str,
    "category": str,
    "input": {...normalized profile...},
    "matched_schemes": [{scheme_id, scheme_name, status, score}],
    "recommended_scheme": {scheme_id, scheme_name, status, score} | None,
    "scheme_id": str | None,
    "emi": {...EMIResult...} | None,
    "partners": [...],
    "citations": [...],
    "explanation": str,
    "readiness": {score, breakdown, weights},
    "documents": [str],
    "requested_amount": float | None,
    "status": str,
    "status_history": [{status, at, note}],
    "conversation_id": str | None,
    "created_at": str,
    "updated_at": str,
}

Status machine (deterministic): analysis_completed -> ready_to_apply ->
application_started -> documents_submitted -> under_review -> approved|rejected.
"""

from __future__ import annotations
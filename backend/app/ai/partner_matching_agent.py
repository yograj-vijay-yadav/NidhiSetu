"""Partner Matching Agent.

Deterministic partner filtering (NPA/inactive exclusion, scheme/category/city
matching) with a short AI narration when Groq is available. The filtered list
itself is produced by the deterministic partner service — never by the LLM.
"""

from __future__ import annotations

from typing import Any

from app.ai import llm_service
from app.services import partner_service


def run_partner_matching(state: dict[str, Any]) -> dict[str, Any]:
    """Node body: deterministic partner match for the recommended scheme."""
    profile = state.get("normalized_input") or {}
    recommended = state.get("recommended_scheme")
    scheme_id = recommended["scheme_id"] if recommended else None

    partners = partner_service.match_partners(
        scheme_id=scheme_id,
        category=profile.get("category"),
        limit=5,
    )

    return {
        "partners": partners,
        "reasoning_trace": state.get("reasoning_trace", [])
        + [
            {
                "agent": "Partner Agent",
                "action": "Filtered inactive and NPA-flagged partners; matched by scheme and category",
            }
        ],
    }


def partner_summary_text(partners: list[dict[str, Any]]) -> str:
    """Deterministic summary used in the serialized analysis output."""
    if not partners:
        return "No active authorized partners matched in the demo dataset for this scheme."
    top = partners[0]
    return (
        f"{len(partners)} active authorized partner(s) matched. Closest: {top['name']} "
        f"({top.get('city', '')}, ~{top.get('distance_km', 0):.1f} km). Contact the partner to "
        "begin your application — approval is decided by the authorized institution."
    )
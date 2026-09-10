"""LangGraph state definition for the NidhiSetu multi-agent pipeline.

The state travels Intake -> flow router (education/business) -> Eligibility ->
Explanation -> Partner matching. Only *user-safe* fields are carried; no
hidden chain-of-thought ever enters or leaves the graph.
"""

from __future__ import annotations

from typing import Any, TypedDict


class NidhiSetuState(TypedDict, total=False):
    # --- Inputs ---
    user_input: str                 # raw natural-language text (optional)
    structured_input: dict[str, Any]  # profile from form intake (optional)
    conversation_id: str
    is_followup: bool

    # --- Intake output ---
    normalized_input: dict[str, Any]
    missing_fields: list[str]
    clarification_question: str | None
    needs_clarification: bool
    extraction_source: str          # "llm" | "deterministic_parser" | "form"

    # --- Flow routing ---
    flow: str                       # "education" | "business" | "mixed"

    # --- Eligibility (deterministic) ---
    eligibility_results: list[dict[str, Any]]
    recommended_scheme: dict[str, Any] | None
    emi: dict[str, Any] | None

    # --- RAG ---
    retrieved_context: list[dict[str, Any]]  # citations
    rag_available: bool
    rag_warning: str | None

    # --- Explanation (AI narrated, deterministically backed) ---
    explanation: str
    ai_meta: dict[str, Any]

    # --- Partners ---
    partners: list[dict[str, Any]]

    # --- Trace (user-safe) ---
    reasoning_trace: list[dict[str, str]]

    # --- Output metadata ---
    is_demo_data: bool
    error: str | None
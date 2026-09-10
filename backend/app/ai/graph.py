"""LangGraph multi-agent orchestration.

Graph:
    START -> intake -> route (clarify END | education/business) -> eligibility
          -> explanation -> partners -> END

- Conditional routing on education vs business (spec §18).
- MemorySaver checkpointer keyed by `conversation_id` enables follow-up
  questions ("what if my project cost is 1.3 lakh?") without re-entering the
  whole profile (spec §20).
- Every external call is behind the Groq/Pinecone fallbacks (spec §19/§25);
  the graph can never crash the API.
"""

from __future__ import annotations

from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.ai import intake_agent, partner_matching_agent
from app.ai.eligibility_agent import (
    route_from_intake,
    run_business_flow,
    run_education_flow,
    run_eligibility,
)
from app.ai.explanation_agent import generate_explanation
from app.ai.state import NidhiSetuState
from app.rules.scheme_rules import SUPPORTED_CATEGORIES
from app.utils.errors import DomainValidationError


def run_intake(state: dict[str, Any]) -> dict[str, Any]:
    """Intake node: form profile or NL text -> normalized_input (+ trace)."""
    trace = list(state.get("reasoning_trace") or [])
    conversation_id = state.get("conversation_id") or ""

    structured = state.get("structured_input")
    text = (state.get("user_input") or "").strip()
    is_followup = bool(state.get("is_followup"))

    if structured:
        normalized = intake_agent.normalize_profile(structured)
        source = "form"
        meta: dict[str, Any] = {"extraction_source": source}
        trace.append({"agent": "Intake Agent", "action": "Normalized form-provided beneficiary information"})
    elif text:
        if is_followup or intake_agent.is_followup(text):
            parsed, meta = intake_agent.llm_parse(text)
            previous = dict(state.get("normalized_input") or {})
            normalized = intake_agent.merge_followup(previous, parsed)
            is_followup = True
            trace.append(
                {
                    "agent": "Intake Agent",
                    "action": "Interpreted follow-up question and merged it onto the conversation profile",
                }
            )
        else:
            parsed, meta = intake_agent.llm_parse(text)
            normalized = intake_agent.normalize_profile(parsed)
            trace.append(
                {
                    "agent": "Intake Agent",
                    "action": f"Extracted structured input from natural language (source: {meta.get('extraction_source')})",
                }
            )
    else:
        raise DomainValidationError("MISSING_INPUT", "Provide either 'text' or 'profile' in the request.")

    if normalized.get("category") not in SUPPORTED_CATEGORIES:
        # Present but unsupported -> hard error. Missing entirely -> clarification request.
        if normalized.get("category"):
            raise DomainValidationError(
                "UNSUPPORTED_CATEGORY",
                f"Unsupported beneficiary category '{normalized['category']}'. Supported: {', '.join(SUPPORTED_CATEGORIES)}.",
            )

    missing = intake_agent.missing_fields(normalized)
    needs_clarification = bool(missing)
    return {
        "normalized_input": normalized,
        "missing_fields": missing,
        "needs_clarification": needs_clarification,
        "clarification_question": intake_agent.clarification_question(missing) if missing else None,
        "is_followup": is_followup,
        "ai_meta": {**(state.get("ai_meta") or {}), **meta},
        "reasoning_trace": trace,
        "conversation_id": conversation_id,
    }


def run_explanation(state: dict[str, Any]) -> dict[str, Any]:
    """Explanation node: AI narration over deterministic facts (never numbers)."""
    explanation, meta = generate_explanation(
        profile=state.get("normalized_input") or {},
        results=state.get("eligibility_results") or [],
        recommended=state.get("recommended_scheme"),
        emi=state.get("emi"),
        citations=state.get("retrieved_context") or [],
        partners=state.get("partners") or [],
    )
    trace = list(state.get("reasoning_trace") or [])
    trace.append(
        {
            "agent": "Explanation Agent",
            "action": (
                "Generated explanation from retrieved evidence and deterministic results"
                if not meta.get("fallback_used")
                else "Generated deterministic fallback explanation (AI unavailable)"
            ),
        }
    )
    return {"explanation": explanation, "ai_meta": meta, "reasoning_trace": trace}


def _build_graph():
    builder = StateGraph(NidhiSetuState)

    builder.add_node("intake", run_intake)
    builder.add_node("education_flow", run_education_flow)
    builder.add_node("business_flow", run_business_flow)
    builder.add_node("eligibility", run_eligibility)
    builder.add_node("explanation", run_explanation)
    builder.add_node("partners", partner_matching_agent.run_partner_matching)

    builder.add_edge(START, "intake")
    builder.add_conditional_edges(
        "intake",
        route_from_intake,
        {
            "clarify": END,
            "education": "education_flow",
            "business": "business_flow",
        },
    )
    builder.add_edge("education_flow", "eligibility")
    builder.add_edge("business_flow", "eligibility")
    builder.add_edge("eligibility", "explanation")
    builder.add_edge("explanation", "partners")
    builder.add_edge("partners", END)

    return builder.compile(checkpointer=MemorySaver())


graph = _build_graph()


def serialize_state(state: dict[str, Any]) -> dict[str, Any]:
    """User-safe projection of the graph state (never exposes internals)."""
    from app.services.readiness_service import compute_readiness

    partners = state.get("partners") or []
    is_demo = bool((state.get("normalized_input") or {}).get("category")) and state.get("is_demo_data", True)
    recommended = state.get("recommended_scheme")
    readiness = compute_readiness(
        status=recommended.get("status") if recommended else None,
        inputs=state.get("normalized_input") or {},
        recommended=recommended,
        scheme_id=recommended.get("scheme_id") if recommended else None,
        category=(state.get("normalized_input") or {}).get("category"),
        documents=[],
    )
    return {
        "conversation_id": state.get("conversation_id") or "",
        "input": state.get("normalized_input") or {},
        "is_followup": bool(state.get("is_followup")),
        "flow": state.get("flow") or "unknown",
        "matched_schemes": state.get("eligibility_results") or [],
        "recommended_scheme": state.get("recommended_scheme"),
        "emi": state.get("emi"),
        "partners": partners,
        "partners_narration": state.get("partners_narration") or "",
        "explanation": state.get("explanation") or "",
        "ai_meta": state.get("ai_meta") or {},
        "readiness": readiness,
        "citations": state.get("retrieved_context") or [],
        "rag_available": bool(state.get("rag_available")),
        "rag_warning": state.get("rag_warning"),
        "reasoning_trace": state.get("reasoning_trace") or [],
        "needs_clarification": bool(state.get("needs_clarification")),
        "clarification_question": state.get("clarification_question"),
        "missing_fields": state.get("missing_fields") or [],
        "is_demo_data": is_demo,
    }


def run_analysis(
    *,
    text: str | None = None,
    profile: dict[str, Any] | None = None,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    """Invoke the graph. Returns the serialized user-safe result.

    Raises DomainValidationError for malformed input; external service failures
    are absorbed by the fallback machinery inside the agents.
    """
    import uuid

    conv_id = conversation_id or uuid.uuid4().hex
    initial: dict[str, Any] = {
        "user_input": text or "",
        "structured_input": profile,
        "conversation_id": conv_id,
        "is_followup": False,
        "reasoning_trace": [],
        "ai_meta": {},
        "is_demo_data": True,
    }
    result = graph.invoke(initial, config={"configurable": {"thread_id": conv_id}})
    result["conversation_id"] = conv_id
    return serialize_state(result)
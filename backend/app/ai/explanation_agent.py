"""Explanation Agent.

AI WORLD component. Generates user-friendly narration of *pre-computed*
deterministic eligibility, EMI and partner facts, grounded in RAG citations
when available. Any Groq failure falls back to deterministic template text —
the explanation can never change the underlying numbers.

IMPORTANT: no hidden chain-of-thought. The LLM receives only user-safe facts
and returns plain-language explanation.
"""

from __future__ import annotations

from typing import Any

from app.ai import llm_service


def _deterministic_explanation(
    recommended: dict[str, Any] | None,
    emi: dict[str, Any] | None,
    citations: list[dict[str, Any]],
) -> str:
    if recommended is None:
        return (
            "Based on the details provided, none of the configured (demo) schemes match this "
            "profile. Review the failed eligibility checks below or use the what-if simulator "
            "to try different values. Final approval belongs to the relevant government "
            "agency or authorized institution."
        )
    parts = [
        f"Based on the configured (demo) scheme criteria, you are "
        f"'{recommended['status'].replace('_', ' ')}' for the {recommended['scheme_name']}."
    ]
    failed = [c for c in recommended["checks"] if not c["result"]]
    if failed:
        parts.append("Checks that did not pass: " + "; ".join(c["detail"] for c in failed) + ".")
    else:
        parts.append("All configured eligibility checks passed.")
    if emi:
        parts.append(
            f"Indicative EMI: about ₹{emi['monthly_emi']:,.0f}/month on ₹{emi['loan_amount']:,.0f} "
            f"over {emi['repayment_months']} months."
        )
    if citations:
        parts.append(
            "Supporting evidence: " + "; ".join(c.get("source_document", "source") for c in citations[:2]) + "."
        )
    else:
        parts.append("No official document was retrieved; verify all figures against official guidelines.")
    parts.append(
        "This is an educational estimate — final approval belongs to the relevant government "
        "agency, bank or authorized institution."
    )
    return " ".join(parts)


def generate_explanation(
    profile: dict[str, Any],
    results: list[dict[str, Any]],
    recommended: dict[str, Any] | None,
    emi: dict[str, Any] | None,
    citations: list[dict[str, Any]],
    partners: list[dict[str, Any]],
) -> tuple[str, dict[str, Any]]:
    """Return (explanation, ai_meta). Never raises."""
    fallback = _deterministic_explanation(recommended, emi, citations)
    if recommended is None:
        return fallback, {"fallback_used": True, "fallback_reason": "no eligible scheme"}

    rejected = [
        r for r in results if r["scheme_id"] != recommended["scheme_id"] and r["status"] == "not_eligible"
    ]
    checks_summary = "; ".join(f"{c['rule']}: {'pass' if c['result'] else 'fail'}" for c in recommended["checks"])
    facts = {
        "profile": {
            "category": profile.get("category"),
            "annual_income": profile.get("annual_income"),
            "age": profile.get("age"),
            "project_cost": profile.get("project_cost"),
            "education_cost": profile.get("education_cost"),
            "purpose": profile.get("purpose"),
        },
        "recommended": {
            "scheme_name": recommended["scheme_name"],
            "status": recommended["status"],
            "score": recommended["score"],
            "checks": checks_summary,
        },
        "emi": (
            {
                "monthly_emi": emi["monthly_emi"],
                "loan_amount": emi["loan_amount"],
                "repayment_months": emi["repayment_months"],
            }
            if emi
            else None
        ),
        "rejected_schemes": [r["scheme_id"] for r in rejected],
        "citations": [
            {"source_document": c.get("source_document"), "source_section": c.get("source_section")}
            for c in citations[:3]
        ],
        "partner_count": len(partners),
    }
    system = (
        "You are NidhiSetu's scheme advisor for Indian government assistance schemes. "
        "You narrate PRE-COMPUTED deterministic results. You NEVER recalculate, override or "
        "invent numbers. You never promise loan approval. Use 'potentially eligible' wording. "
        "Answer in plain, warm, simple language (max 120 words). Mention evidence sources only "
        "if provided. If the scheme data is demo/placeholder, say so."
    )
    ai = llm_service.complete(
        system,
        "Explain this deterministic result:\n" + str(facts),
        max_tokens=380,
        fallback_text=fallback,
    )
    meta = {
        "fallback_used": ai.fallback_used,
        "fallback_reason": ai.fallback_reason if ai.fallback_used else None,
        "model": ai.model,
    }
    return ai.text, meta
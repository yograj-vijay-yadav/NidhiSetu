"""Intake Agent.

Converts natural-language requirements into a structured beneficiary profile.

Two paths:
1. Structured form input (frontend wizard) — normalized directly, no LLM.
2. Natural language — LLM extraction with a deterministic regex parser
   fallback, so the pipeline works (and is unit-testable) without Groq.

Never hallucinates: unknown values stay `None`, which routes the graph to a
structured clarification request rather than a guessed answer.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.ai import llm_service
from app.rules.scheme_rules import SUPPORTED_CATEGORIES, SUPPORTED_PURPOSES

_AMOUNT_RE = re.compile(
    r"₹?\s*(\d{1,3}(?:,\d{3})+|\d+\.?\d*)\s*(lakh|lac|lakhs|crore|crores|cr)?",
    re.IGNORECASE,
)
_CATEGORY_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("sc", re.compile(r"\b(sc|scheduled\s*caste)\b", re.IGNORECASE)),
    ("st", re.compile(r"\b(st|scheduled\s*tribe)\b", re.IGNORECASE)),
    ("obc", re.compile(r"\b(obc|other\s*backward)\b", re.IGNORECASE)),
    (
        "minority",
        re.compile(
            r"\b(minority|minorities|muslim|christian|sikh|jain|buddhist|parsi)\b", re.IGNORECASE
        ),
    ),
    ("women", re.compile(r"\b(women|woman|female|mahila|she)\b", re.IGNORECASE)),
]
_PURPOSE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("business", re.compile(r"\b(business|shop|enterprise|start[- ]up|company|venture|trade)\b", re.IGNORECASE)),
    ("self_employment", re.compile(r"\b(self[- ]employ|freelanc|sole proprietor|own practice)\b", re.IGNORECASE)),
    ("education", re.compile(r"\b(education|study|studying|degree|course|college|engineering|graduation|post[- ]graduation)\b", re.IGNORECASE)),
    ("skill_development", re.compile(r"\b(skill|upskill|training|vocational|course|diploma|certificate)\b", re.IGNORECASE)),
]
_AGE_RE = re.compile(r"\b(?:age|aged)?\s*(\d{2})\s*(?:years?\s*)?(?:old|of age)?\b")
_WHATIF_RE = re.compile(r"\b(what if|what about|change|increase|decrease|reduce|raise|lower|instead)\b", re.IGNORECASE)


def _to_rupees(match: re.Match[str]) -> float:
    amount = float(match.group(1).replace(",", ""))
    unit = (match.group(2) or "").lower()
    if unit.startswith("crore") or unit == "cr":
        return amount * 10_000_000
    if unit.startswith("lakh") or unit.startswith("lac"):
        return amount * 100_000
    return amount


def _extract_amounts(text: str) -> list[float]:
    return [_to_rupees(m) for m in _AMOUNT_RE.finditer(text)]


def _assign_amounts(text: str, amounts: list[float]) -> dict[str, float]:
    """Heuristic mapping of amounts to profile fields; only well-evidenced
    assignments are made (never guess which amount is which)."""
    out: dict[str, float] = {"annual_income": None, "project_cost": None, "education_cost": None}
    lower = text.lower()

    def has(pattern: str) -> bool:
        return re.search(pattern, lower) is not None

    if amounts:
        income_match = re.search(
            r"(income|earn|salary|family\s*income)\b[^.]*?([\d,]+(?:[.,]\d+)?\s*(?:lakh|lac|lakhs|crore|crores|cr)?)",
            lower,
        )
        if income_match:
            sub = _AMOUNT_RE.search(income_match.group(0))
            income_amount = _to_rupees(sub) if sub else None
            if income_amount is not None:
                out["annual_income"] = income_amount
                remaining = [a for a in amounts if abs(a - income_amount) > 0.5]
            else:
                remaining = amounts
        else:
            remaining = amounts

        if remaining:
            if has(r"education|study|course|degree|college|engineering|tuition"):
                out["education_cost"] = remaining[-1]
            elif has(r"business|shop|start|enterprise|venture|project"):
                out["project_cost"] = remaining[-1]
            elif len(remaining) == 1:
                # A single, unlabelled amount: treat as the financing need.
                out["project_cost"] = remaining[0]
    return out


def deterministic_parse(text: str) -> dict[str, Any]:
    """Deterministic, regex-based extraction. Never invents facts."""
    result: dict[str, Any] = {"category": None, "age": None, "purpose": None, "is_education": False}

    for category, pattern in _CATEGORY_PATTERNS:
        if pattern.search(text):
            result["category"] = category
            break

    age_match = _AGE_RE.search(text)
    if age_match:
        result["age"] = int(age_match.group(1))

    purpose_found = None
    for purpose, pattern in _PURPOSE_PATTERNS:
        if pattern.search(text):
            purpose_found = purpose
            break
    if purpose_found:
        result["purpose"] = purpose_found
        result["is_education"] = purpose_found in ("education", "skill_development")

    amounts = _extract_amounts(text)
    result.update(_assign_amounts(text, amounts))

    # Student without explicit purpose -> education is a safe, evidence-based default.
    if re.search(r"\bstudent\b|\bstudying\b|\bpursuing\b", text, re.IGNORECASE):
        if not result["purpose"]:
            result["purpose"] = "education"
            result["is_education"] = True

    return result


def llm_parse(text: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """LLM extraction with deterministic fallback. Returns (parsed, meta)."""
    system = (
        "You extract structured loan-scheme beneficiary data from Indian English text. "
        "Return ONLY a JSON object with keys: category (one of "
        + ", ".join(SUPPORTED_CATEGORIES)
        + "), annual_income (number, rupees), age (integer), project_cost (number), "
        "education_cost (number), purpose (one of " + ", ".join(SUPPORTED_PURPOSES)
        + "), is_education (boolean). If a value is not mentioned, use null. "
        "Never guess or default values that are absent."
    )
    ai = llm_service.complete(
        system,
        f"Extract from this requirement: \"{text}\"",
        temperature=0.0,
        max_tokens=220,
        fallback_text="",
    )
    if ai.fallback_used:
        return deterministic_parse(text), {
            "extraction_source": "deterministic_parser",
            "fallback_used": True,
            "fallback_reason": ai.fallback_reason,
        }
    try:
        payload = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", ai.text.strip()))
        cleaned = {
            k: (v if v not in ("", "null", "none") else None)
            for k, v in payload.items()
            if k
            in ("category", "annual_income", "age", "project_cost", "education_cost", "purpose", "is_education")
        }
        # Validate against supported enums; drop anything unknown rather than trusting it.
        if cleaned.get("category") not in SUPPORTED_CATEGORIES:
            cleaned["category"] = None
        if cleaned.get("purpose") not in SUPPORTED_PURPOSES:
            cleaned["purpose"] = None
        return cleaned, {"extraction_source": "llm", "fallback_used": False, "model": ai.model}
    except (json.JSONDecodeError, TypeError):
        return deterministic_parse(text), {"extraction_source": "deterministic_parser", "fallback_used": True}


def is_followup(text: str) -> bool:
    """Heuristic: a 'what if / change X' sentence is a follow-up, not fresh intake."""
    return bool(_WHATIF_RE.search(text or ""))


def merge_followup(previous: dict[str, Any], parsed: dict[str, Any]) -> dict[str, Any]:
    """Merge a follow-up's extracted fields onto previous normalized input."""
    merged = dict(previous)
    for key, value in parsed.items():
        if value is not None:
            merged[key] = value
    return merged


def missing_fields(profile: dict[str, Any]) -> list[str]:
    """Fields required to run deterministic eligibility."""
    missing: list[str] = []
    if not profile.get("category"):
        missing.append("category")
    if profile.get("annual_income") is None:
        missing.append("annual_income")
    if profile.get("age") is None:
        missing.append("age")
    if profile.get("is_education"):
        if profile.get("education_cost") is None and profile.get("project_cost") is None:
            missing.append("education_cost")
    elif profile.get("project_cost") is None and profile.get("education_cost") is None:
        missing.append("project_cost")
    return missing


def clarification_question(missing: list[str]) -> str:
    prompts = {
        "category": "Which beneficiary category applies (SC, ST, OBC, Minority, Women, General)?",
        "annual_income": "What is your (or your family's) annual income?",
        "age": "What is your age?",
        "project_cost": "What is the estimated project cost / loan amount you need?",
        "education_cost": "What is the education cost / course fee you need financing for?",
    }
    return " ".join(prompts[f] for f in missing if f in prompts) or (
        "Please share a few more details so we can evaluate your eligibility."
    )


def normalize_profile(profile: dict[str, Any]) -> dict[str, Any]:
    """Normalize a (form or extracted) profile into canonical shape."""
    category = str(profile.get("category") or "").strip().lower()
    purpose = profile.get("purpose")
    purpose = str(purpose).strip().lower() if purpose else None
    is_education = bool(profile.get("is_education", False))
    if purpose in ("education", "skill_development"):
        is_education = True
    normalized = {
        "category": category,
        "annual_income": profile.get("annual_income"),
        "age": profile.get("age"),
        "project_cost": profile.get("project_cost"),
        "education_cost": profile.get("education_cost"),
        "purpose": purpose,
        "is_education": is_education,
    }
    for key in ("annual_income", "project_cost", "education_cost"):
        try:
            if normalized[key] is not None:
                normalized[key] = float(normalized[key])
        except (TypeError, ValueError):
            normalized[key] = None
    try:
        if normalized["age"] is not None:
            normalized["age"] = int(normalized["age"])
    except (TypeError, ValueError):
        normalized["age"] = None
    return normalized
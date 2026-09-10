"""LLM service: the ONLY place that talks to Groq (via LangChain's ChatGroq).

AI WORLD component. Design rules:
- The model is created lazily; a missing/unreachable API never crashes the
  platform. Callers always get either a real completion or the explicit
  `fallback_used=True` marker plus deterministic text.
- The API key comes exclusively from settings/environment — never hardcoded.
- Callers pass fully-formed, user-safe prompts; no hidden chain-of-thought is
  ever requested, logged or returned.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

FALLBACK_REASON_NO_KEY = "GROQ_API_KEY not configured (demo fallback in use)"
FALLBACK_REASON_ERROR = "Groq API call failed (demo fallback in use)"


@dataclass
class LLMResult:
    text: str
    fallback_used: bool
    fallback_reason: str | None = None
    model: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


_llm = None
_llm_initialized = False


def _get_llm():
    global _llm, _llm_initialized
    if not _llm_initialized:
        _llm_initialized = True
        if settings.groq_api_key:
            try:
                from langchain_groq import ChatGroq

                _llm = ChatGroq(
                    model=settings.groq_model,
                    api_key=settings.groq_api_key,
                    temperature=0.2,
                    max_tokens=settings.llm_max_tokens,
                    timeout=25,
                )
            except Exception as exc:  # pragma: no cover - import-time failure
                logger.warning("Could not initialise ChatGroq: %s", type(exc).__name__)
                _llm = None
    return _llm



def complete(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.2,
    max_tokens: int | None = None,
    fallback_text: str = "",
    fallback_reason_detail: str | None = None,
) -> LLMResult:
    """One-shot completion with hard fallback on any failure."""
    llm = _get_llm()
    if llm is None:
        return LLMResult(
            text=fallback_text,
            fallback_used=True,
            fallback_reason=fallback_reason_detail or FALLBACK_REASON_NO_KEY,
        )

    try:
        from langchain_core.messages import HumanMessage, SystemMessage

        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ],
            config={"temperature": temperature, "max_tokens": max_tokens or settings.llm_max_tokens},
        )
        text = (getattr(response, "content", "") or "").strip()
        if not text:
            raise ValueError("Empty completion")
        return LLMResult(text=text, fallback_used=False, model=settings.groq_model)
    except Exception as exc:
        logger.warning("Groq completion failed: %s", type(exc).__name__)
        return LLMResult(
            text=fallback_text,
            fallback_used=True,
            fallback_reason=fallback_reason_detail or FALLBACK_REASON_ERROR,
            raw={"error_type": type(exc).__name__},
        )


def health_status() -> dict[str, Any]:
    configured = bool(settings.groq_api_key)
    return {
        "configured": configured,
        "reachable": configured and _get_llm() is not None,
        "model": settings.groq_model if configured else None,
    }
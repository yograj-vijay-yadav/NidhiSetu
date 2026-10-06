"""Shared constants (disclaimers, demo-data labels)."""

from __future__ import annotations

DISCLAIMER = (
    "Potentially eligible based on configured scheme criteria. This is not an approval and not a "
    "guarantee of credit. Final approval rests with the relevant government agency or institution."
)
ANSWERING_NOTE = "NidhiSetu is a decision-support tool. It never approves or rejects an application."

EVIDENCE_STATUSES = (
    "SUPPORTED",
    "PARTIALLY_SUPPORTED",
    "INSUFFICIENT_EVIDENCE",
    "CONFLICTING_EVIDENCE",
)


APPLICATION_STATUSES = (
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
)
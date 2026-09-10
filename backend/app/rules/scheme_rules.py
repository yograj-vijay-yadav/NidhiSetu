"""Scheme rule loading.

Rules are 100% data-driven from `data/scheme_rules/<category>.json`. No
thresholds live in Python code. Every rule file carries `_meta.is_demo_data`
and `source: DEMO_PLACEHOLDER` so placeholder values can never masquerade as
official policy.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from app.config import settings
from app.utils.errors import DomainValidationError

SUPPORTED_CATEGORIES = ("sc", "st", "obc", "minority", "women", "general")
SUPPORTED_PURPOSES = ("business", "self_employment", "education", "skill_development")

# Fields every scheme entry must provide; the loader fails fast otherwise.
REQUIRED_SCHEME_FIELDS = (
    "scheme_id",
    "name",
    "categories",
    "purpose",
    "interest_rate",
    "tenure_years",
    "moratorium_months",
    "loan_percentage",
    "minimum_age",
    "maximum_age",
)


@dataclass(frozen=True)
class SchemeRule:
    """One immutable, data-driven scheme definition."""

    scheme_id: str
    name: str
    description: str
    categories: tuple[str, ...]
    purpose: tuple[str, ...]
    loan_percentage: float
    interest_rate: float
    tenure_years: int
    moratorium_months: int
    moratorium_policy: str
    minimum_age: int
    maximum_age: int
    income_cap: float | None
    max_project_cost: float | None  # business schemes
    max_education_cost: float | None  # education/skilling schemes
    max_loan_amount: float | None
    channelizing_agencies: tuple[str, ...]
    source_document: str
    is_demo_data: bool
    raw: dict[str, Any] = field(default_factory=dict, repr=False)

    def cost_cap_for(self, is_education: bool) -> float | None:
        """The cost cap relevant to this profile's purpose."""
        if is_education:
            return self.max_education_cost if self.max_education_cost is not None else self.max_project_cost
        return self.max_project_cost if self.max_project_cost is not None else self.max_education_cost

    def supports_purpose(self, is_education: bool, purpose: str | None) -> bool:
        if purpose:
            return purpose in self.purpose
        expected = "education" if is_education else "business"
        return expected in self.purpose

    def to_public_dict(self) -> dict[str, Any]:
        """Safe representation for API responses."""
        return {
            "scheme_id": self.scheme_id,
            "name": self.name,
            "description": self.description,
            "categories": list(self.categories),
            "purpose": list(self.purpose),
            "loan_percentage": self.loan_percentage,
            "interest_rate": self.interest_rate,
            "tenure_years": self.tenure_years,
            "moratorium_months": self.moratorium_months,
            "moratorium_policy": self.moratorium_policy,
            "income_cap": self.income_cap,
            "max_project_cost": self.max_project_cost,
            "max_education_cost": self.max_education_cost,
            "max_loan_amount": self.max_loan_amount,
            "minimum_age": self.minimum_age,
            "maximum_age": self.maximum_age,
            "channelizing_agencies": list(self.channelizing_agencies),
            "source_document": self.source_document,
            "is_demo_data": self.is_demo_data,
        }


def _parse_scheme(raw: dict[str, Any], default_demo: bool) -> SchemeRule:
    missing = [f for f in REQUIRED_SCHEME_FIELDS if f not in raw]
    if missing:
        raise ValueError(f"Scheme rule missing required fields: {missing}")
    return SchemeRule(
        scheme_id=str(raw["scheme_id"]),
        name=str(raw["name"]),
        description=str(raw.get("description", "")),
        categories=tuple(c.lower() for c in raw["categories"]),
        purpose=tuple(p.lower() for p in raw["purpose"]),
        loan_percentage=float(raw["loan_percentage"]),
        interest_rate=float(raw["interest_rate"]),
        tenure_years=int(raw["tenure_years"]),
        moratorium_months=int(raw.get("moratorium_months", 0)),
        moratorium_policy=str(raw.get("moratorium_policy", "interest_accrues")),
        minimum_age=int(raw["minimum_age"]),
        maximum_age=int(raw["maximum_age"]),
        income_cap=None if raw.get("income_cap") is None else float(raw["income_cap"]),
        max_project_cost=None if raw.get("max_project_cost") is None else float(raw["max_project_cost"]),
        max_education_cost=None if raw.get("max_education_cost") is None else float(raw["max_education_cost"]),
        max_loan_amount=None if raw.get("max_loan_amount") is None else float(raw["max_loan_amount"]),
        channelizing_agencies=tuple(raw.get("channelizing_agencies", ())),
        source_document=str(raw.get("source_document", "DEMO_PLACEHOLDER")),
        is_demo_data=bool(raw.get("is_demo_data", default_demo)),
        raw=dict(raw),
    )


@lru_cache(maxsize=32)
def _load_category_file(category: str, data_dir_str: str) -> dict[str, Any]:
    path = f"{data_dir_str}/scheme_rules/{category}.json"
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError as exc:
        raise DomainValidationError(
            "CATEGORY_RULES_MISSING",
            f"No scheme rule file is configured for category '{category}'.",
        ) from exc
    except json.JSONDecodeError as exc:
        raise DomainValidationError(
            "CATEGORY_RULES_INVALID",
            f"Scheme rule file for category '{category}' is not valid JSON.",
        ) from exc
    if not isinstance(data.get("schemes"), list):
        raise DomainValidationError(
            "CATEGORY_RULES_INVALID",
            f"Scheme rule file for category '{category}' has no 'schemes' list.",
        )
    return data


def load_rules_for_category(category: str) -> list[SchemeRule]:
    """Load all scheme rules applicable to a beneficiary category."""
    cat = (category or "").strip().lower()
    if cat not in SUPPORTED_CATEGORIES:
        raise DomainValidationError(
            "UNSUPPORTED_CATEGORY",
            f"Unsupported beneficiary category '{category}'. "
            f"Supported: {', '.join(SUPPORTED_CATEGORIES)}.",
        )
    data = _load_category_file(cat, str(settings.data_dir))
    meta = data.get("_meta", {})
    default_demo = bool(meta.get("is_demo_data", True))
    return [_parse_scheme(raw, default_demo) for raw in data["schemes"]]


def get_scheme_by_id(scheme_id: str) -> SchemeRule | None:
    """Find a scheme definition anywhere in the rule corpus."""
    sid = (scheme_id or "").strip().lower()
    for category in SUPPORTED_CATEGORIES:
        for rule in load_rules_for_category(category):
            if rule.scheme_id == sid:
                return rule
    return None


def list_all_schemes() -> list[SchemeRule]:
    """All unique scheme definitions across all category files."""
    seen: dict[str, SchemeRule] = {}
    for category in SUPPORTED_CATEGORIES:
        for rule in load_rules_for_category(category):
            seen.setdefault(rule.scheme_id, rule)
    return list(seen.values())


def is_demo_corpus() -> bool:
    """True when every loaded scheme is marked as demo data."""
    return all(s.is_demo_data for s in list_all_schemes())

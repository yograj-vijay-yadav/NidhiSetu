"""Pure EMI mathematics.

DETERMINISTIC WORLD — this module NEVER calls an LLM and never touches the
network. Same input in, same numbers out, unit-tested to the paisa.

Moratorium policies (documented assumption, chosen per scheme in rule data):

- `interest_accrues` (default):
    * Simple interest accrues on the principal during the moratorium and is
      added to the principal (principal repayment is deferred, not forgiven).
    * The EMI is then computed on the accrued principal over the remaining
      tenure (`tenure_years` years minus moratorium, minimum 1 year of
      repayment used when moratorium covers the whole tenure).
- `interest_free_deferred`:
    * No interest at all; the (non-accrued) principal is divided equally over
      the post-moratorium repayment months.
- `no_moratorium`:
    * Standard annuity EMI on the full tenure. `moratorium_months` is ignored.

All outputs are rounded to 2 decimals; EMI is additionally rounded to whole
rupees (`monthly_emi`).
"""

from __future__ import annotations

import math
from typing import Any

from app.utils.errors import DomainValidationError

POLICY_INTEREST_ACCRUES = "interest_accrues"
POLICY_INTEREST_FREE = "interest_free_deferred"
POLICY_NONE = "no_moratorium"


def _validate(principal: float, annual_rate: float, tenure_years: float) -> None:
    if principal is None or principal <= 0:
        raise DomainValidationError("INVALID_PRINCIPAL", "Principal must be greater than zero.")
    if annual_rate is None or annual_rate < 0:
        raise DomainValidationError("INVALID_INTEREST_RATE", "Interest rate cannot be negative.")
    if not math.isfinite(principal) or not math.isfinite(annual_rate):
        raise DomainValidationError("INVALID_INPUT", "Principal and interest rate must be finite numbers.")
    if tenure_years is None or tenure_years <= 0:
        raise DomainValidationError("INVALID_TENURE", "Tenure must be at least 1 year.")
    if tenure_years > 40:
        raise DomainValidationError("INVALID_TENURE", "Tenure cannot exceed 40 years.")


def _annuity_emi(principal: float, monthly_rate: float, months: int) -> float:
    if monthly_rate <= 0:
        return principal / months
    factor = (1 + monthly_rate) ** months
    return principal * monthly_rate * factor / (factor - 1)


def _repayment_months(tenure_years: float, moratorium_months: int) -> int:
    """Repayment months after moratorium; at least 12 so tiny tenures stay sane."""
    months = int(round(tenure_years * 12)) - moratorium_months
    return max(months, 12)


def calculate_emi(
    principal: float,
    annual_interest_rate: float,
    tenure_years: float,
    moratorium_months: int = 0,
    moratorium_policy: str = POLICY_INTEREST_ACCRUES,
) -> dict[str, Any]:
    """Compute loan amount, EMI, totals for a loan under a moratorium policy."""
    _validate(principal, annual_interest_rate, tenure_years)
    if moratorium_months < 0:
        raise DomainValidationError("INVALID_MORATORIUM", "Moratorium cannot be negative.")
    if moratorium_months > 120:
        raise DomainValidationError("INVALID_MORATORIUM", "Moratorium cannot exceed 120 months.")

    moratorium_months = int(moratorium_months)
    monthly_rate = annual_interest_rate / 12

    if moratorium_policy == POLICY_NONE or moratorium_months == 0:
        months = int(round(tenure_years * 12))
        emi = _annuity_emi(principal, monthly_rate, months)
        loan_amount = principal
        accrued = 0.0
    elif moratorium_policy == POLICY_INTEREST_FREE:
        months = _repayment_months(tenure_years, moratorium_months)
        emi = principal / months
        loan_amount = principal
        accrued = 0.0
    elif moratorium_policy == POLICY_INTEREST_ACCRUES:
        accrued = principal * monthly_rate * moratorium_months
        loan_amount = principal + accrued
        months = _repayment_months(tenure_years, moratorium_months)
        emi = _annuity_emi(loan_amount, monthly_rate, months)
    else:
        raise DomainValidationError(
            "INVALID_MORATORIUM_POLICY",
            f"Unknown moratorium policy '{moratorium_policy}'.",
        )

    total_payment = emi * months
    total_interest = total_payment - loan_amount if loan_amount > principal else total_payment - principal

    return {
        "loan_amount": round(loan_amount, 2),
        "principal": round(principal, 2),
        "interest_accrued_during_moratorium": round(accrued, 2),
        "repayment_months": months,
        "monthly_emi": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_payment": round(total_payment, 2),
        "moratorium_months": moratorium_months,
        "moratorium_policy": moratorium_policy,
        "annual_interest_rate": annual_interest_rate,
        "tenure_years": tenure_years,
    }


def scheme_financing(
    project_cost: float,
    loan_percentage: float,
    max_loan_amount: float | None = None,
) -> dict[str, float]:
    """Loan amount and own contribution for a project cost under a scheme."""
    if project_cost is None or project_cost <= 0:
        raise DomainValidationError("INVALID_PROJECT_COST", "Project cost must be greater than zero.")
    if not 0 < loan_percentage <= 1:
        raise DomainValidationError("INVALID_LOAN_PERCENTAGE", "Loan percentage must be between 0 and 1.")
    loan = project_cost * loan_percentage
    if max_loan_amount is not None:
        loan = min(loan, max_loan_amount)
    return {
        "loan_amount": round(loan, 2),
        "own_contribution": round(project_cost - loan, 2),
        "loan_percentage": loan_percentage,
    }

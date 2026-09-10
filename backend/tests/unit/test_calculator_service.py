"""Pure EMI calculator tests."""

from __future__ import annotations

import pytest

from app.services.calculator_service import (
    POLICY_INTEREST_ACCRUES,
    POLICY_INTEREST_FREE,
    POLICY_NONE,
    calculate_emi,
    scheme_financing,
)
from app.utils.errors import DomainValidationError


def test_standard_emi_matches_formula():
    # Principal 1,00,000 @ 12% p.a. for 1 year -> monthly rate 1%, EMI ~ 8884.88
    result = calculate_emi(100000, 0.12, 1)
    assert result["monthly_emi"] == pytest.approx(8884.88, abs=0.01)
    assert result["total_payment"] == pytest.approx(106618.55, abs=0.1)
    assert result["total_interest"] == pytest.approx(6618.55, abs=0.1)


def test_zero_interest_emi_is_principal_divided():
    result = calculate_emi(120000, 0.0, 1, moratorium_months=0)
    assert result["monthly_emi"] == pytest.approx(10000, abs=0.01)
    assert result["total_interest"] == 0


def test_negative_principal_rejected():
    with pytest.raises(DomainValidationError):
        calculate_emi(-100, 0.05, 3)


def test_zero_principal_rejected():
    with pytest.raises(DomainValidationError):
        calculate_emi(0, 0.05, 3)


def test_negative_rate_rejected():
    with pytest.raises(DomainValidationError):
        calculate_emi(1000, -0.01, 3)


def test_negative_tenure_rejected():
    with pytest.raises(DomainValidationError):
        calculate_emi(1000, 0.05, -1)


def test_moratorium_accrues_interest_onto_principal():
    # Documented assumption: SIMPLE interest accrues on principal during the
    # moratorium and is capitalized (principal repayment deferred, not forgiven).
    with_mora = calculate_emi(100000, 0.12, 1, moratorium_months=3)
    assert with_mora["interest_accrued_during_moratorium"] == pytest.approx(100000 * (0.12 / 12) * 3, abs=0.01)
    assert with_mora["loan_amount"] == pytest.approx(103000, abs=0.01)
    assert with_mora["loan_amount"] > 100000  # accrued interest capitalized


def test_interest_free_moratorium_does_not_capitalize():
    result = calculate_emi(120000, 0.12, 1, moratorium_months=2, moratorium_policy=POLICY_INTEREST_FREE)
    assert result["loan_amount"] == pytest.approx(120000, abs=0.01)
    assert result["interest_accrued_during_moratorium"] == 0
    # 120000 over repayment months (min 12 by documented assumption)
    assert result["monthly_emi"] == pytest.approx(10000, abs=0.01)
    assert result["repayment_months"] == 12


def test_no_moratorium_policy_ignores_moratorium_months():
    result = calculate_emi(120000, 0.12, 1, moratorium_months=6, moratorium_policy=POLICY_NONE)
    assert result["repayment_months"] == 12
    assert result["monthly_emi"] == pytest.approx(10661.85, abs=0.1)


def test_unknown_moratorium_policy_rejected():
    with pytest.raises(DomainValidationError):
        calculate_emi(1000, 0.05, 3, moratorium_months=1, moratorium_policy="banana")


def test_very_large_and_small_values_are_finite():
    big = calculate_emi(1_000_000_000, 0.08, 30)
    assert all(v > 0 for v in (big["monthly_emi"], big["total_payment"]))
    small = calculate_emi(1, 0.02, 1)
    assert small["monthly_emi"] > 0
    assert small["total_interest"] >= 0


def test_rounding_is_two_decimals():
    result = calculate_emi(126000, 0.065, 3, moratorium_months=3)
    assert result["monthly_emi"] == round(result["monthly_emi"], 2)
    assert result["total_payment"] == round(result["total_payment"], 2)


def test_scheme_financing_splits_own_contribution():
    fin = scheme_financing(project_cost=140000, loan_percentage=0.90, max_loan_amount=140000)
    assert fin["loan_amount"] == pytest.approx(126000)
    assert fin["own_contribution"] == pytest.approx(14000)


def test_scheme_financing_respects_max_loan():
    fin = scheme_financing(project_cost=2000000, loan_percentage=0.90, max_loan_amount=1800000)
    assert fin["loan_amount"] == pytest.approx(1800000)
    assert fin["own_contribution"] == pytest.approx(200000)


def test_scheme_financing_rejects_zero_project_cost():
    with pytest.raises(DomainValidationError):
        scheme_financing(project_cost=0, loan_percentage=0.9)
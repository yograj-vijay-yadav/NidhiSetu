"""Scheme rule corpus tests."""

from __future__ import annotations

import pytest

from app.rules.scheme_rules import (
    SUPPORTED_CATEGORIES,
    get_scheme_by_id,
    is_demo_corpus,
    list_all_schemes,
    load_rules_for_category,
)


def test_every_category_file_loads():
    for category in SUPPORTED_CATEGORIES:
        rules = load_rules_for_category(category)
        assert rules, f"category {category} must expose at least one scheme"


def test_corpus_is_explicitly_demo():
    assert is_demo_corpus()


def test_all_schemes_have_valid_configuration():
    for rule in list_all_schemes():
        assert 0 < rule.loan_percentage <= 1
        assert 0 <= rule.interest_rate < 1
        assert rule.tenure_years > 0
        assert rule.minimum_age < rule.maximum_age
        if rule.income_cap is not None:
            assert rule.income_cap > 0


def test_dedup_across_category_files():
    ids = [s.scheme_id for s in list_all_schemes()]
    assert len(ids) == len(set(ids)), "same scheme_id must appear only once"


def test_scheme_lookup_by_id():
    rule = get_scheme_by_id("education_loan")
    assert rule is not None
    assert "education" in rule.purpose


def test_scheme_lookup_unknown_returns_none():
    assert get_scheme_by_id("not_a_scheme") is None


def test_income_cap_is_category_specific_via_data():
    # micro_finance has income_cap 300000 in the SC corpus (data-driven).
    rule = get_scheme_by_id("micro_finance")
    assert rule.income_cap == 300000
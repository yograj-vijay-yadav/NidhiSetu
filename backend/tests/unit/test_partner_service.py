"""Partner service tests."""

from __future__ import annotations

from app.services.partner_service import list_partners, match_partners


def test_npa_partners_never_recommended():
    matched = match_partners(limit=50)
    assert matched
    assert all(not p["npa_flag"] for p in matched)


def test_inactive_partners_never_recommended():
    matched = match_partners(limit=50)
    assert all(p["is_active"] for p in matched)


def test_matching_by_scheme_filters_correctly():
    for partner in match_partners(scheme_id="mahila_loan", limit=50):
        assert "mahila_loan" in partner["schemes"]


def test_matching_by_category_filters_correctly():
    for partner in match_partners(category="women", limit=50):
        assert "women" in partner["categories"]


def test_matching_by_city_filters_correctly():
    for partner in match_partners(city="Pune", limit=50):
        assert partner["city"].lower() == "pune"


def test_npa_partner_with_best_distance_still_excluded():
    # partner_006 is NPA-flagged at distance 2.0; partner_005 is NPA at 15.0.
    matched = match_partners(scheme_id="micro_finance", category="sc", limit=50)
    ids = [p["id"] for p in matched]
    assert "partner_006" not in ids
    assert "partner_005" not in ids


def test_limit_respected():
    assert len(match_partners(limit=2)) == 2


def test_no_scheme_match_returns_empty():
    assert match_partners(scheme_id="does_not_exist", limit=10) == []


def test_all_listed_partners_have_required_keys():
    for p in list_partners():
        assert p["id"]
        assert p["name"]
        assert "npa_flag" in p
        assert "is_active" in p
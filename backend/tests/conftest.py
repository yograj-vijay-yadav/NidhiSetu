"""Shared test fixtures.

All tests run against the demo rule corpus (DEMO/PLACEHOLDER data), which is
exactly how the platform behaves out of the box.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rules.scheme_rules import load_rules_for_category


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def sc_rules():
    return load_rules_for_category("sc")


@pytest.fixture()
def women_rules():
    return load_rules_for_category("women")


@pytest.fixture()
def general_rules():
    return load_rules_for_category("general")
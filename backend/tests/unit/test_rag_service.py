"""RAG service tests (Phase 3)."""

from __future__ import annotations

import pytest

from app.ai import rag_service
from app.config import settings


def _index():
    return rag_service._index_documents()


def test_chunk_ids_are_stable_and_namespaced():
    records = _index()
    assert records
    for record in records:
        assert record["id"].startswith(f"{record['category']}-{record['scheme_id']}-chunk-")
        assert record["chunk_index"] == int(record["id"].rsplit("-", 1)[1])


def test_chunk_metadata_is_complete():
    for record in _index():
        for key in ("category", "scheme_id", "source_document", "source_section", "chunk_index"):
            assert key in record
        assert record["source_document"].endswith((".txt", ".pdf"))


def test_reingestion_is_idempotent_no_duplicates():
    first = _index()
    again = rag_service.reingest_all()
    third = _index()
    assert again["indexed_documents"] == len(first)
    assert len(third) == len(first)
    ids = [r["id"] for r in third]
    assert len(ids) == len(set(ids)), "re-ingestion must not create duplicate chunk ids"


def test_retrieve_returns_citations_with_local_index():
    profile = {"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"}
    citations, available, warning = rag_service.retrieve(profile, scheme_ids=["micro_finance"], top_k=3)
    assert available is True
    assert citations
    for c in citations:
        assert c["source_document"]
        assert c["excerpt"]
        assert c["chunk_id"]


def test_retrieve_filters_by_category():
    sc_citations, _, _ = rag_service.retrieve(
        {"category": "sc", "annual_income": 100000, "age": 30, "project_cost": 100000, "purpose": "business"},
        scheme_ids=["micro_finance"],
        top_k=10,
    )
    for c in sc_citations:
        assert c["chunk_id"].startswith("sc-")


def test_retrieve_filters_by_scheme_id():
    citations, _, _ = rag_service.retrieve(
        {"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"},
        scheme_ids=["micro_finance"],
        top_k=10,
    )
    for c in citations:
        assert "micro_finance" in c["chunk_id"]


def test_retrieve_never_raises_on_bad_input():
    citations, available, warning = rag_service.retrieve({"category": "", "annual_income": None})
    assert isinstance(citations, list)
    assert isinstance(available, bool)
    assert warning is None or isinstance(warning, str)


def test_retrieve_missing_documents_degrades_gracefully(monkeypatch):
    monkeypatch.setattr(rag_service, "_index_documents", lambda: [])
    citations, available, warning = rag_service.retrieve(
        {"category": "sc", "annual_income": 200000, "age": 30, "project_cost": 100000, "purpose": "business"}
    )
    assert citations == []
    assert available is False
    assert "unavailable" in (warning or "")


def test_hash_embed_is_deterministic_and_normalized():
    a = rag_service._hash_embed("micro finance scheme eligibility")
    b = rag_service._hash_embed("micro finance scheme eligibility")
    assert a == b
    norm = sum(x * x for x in a) ** 0.5
    assert norm == pytest.approx(1.0, abs=1e-6)
    assert len(a) == rag_service.EMBED_DIM


def test_ingest_status_reports_corpus():
    status = rag_service.ingest_status()
    assert status["chunk_count"] > 0
    assert status["local_available"] is True
    assert status["documents"]
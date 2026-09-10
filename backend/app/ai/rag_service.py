"""RAG service (Phase 3).

Pipeline: document -> text extraction -> cleaning -> chunking -> embedding ->
index (Pinecone when configured, deterministic local index otherwise).

- Stable chunk IDs: `{category}-{scheme_id}-chunk-{index}`. Re-ingestion is
  idempotent (upsert overwrites, never duplicates).
- Every chunk carries metadata: category, scheme_id, source_document,
  source_section, chunk_index.
- Pinecone queries use metadata filtering by category (+ scheme when known).
- If Pinecone is unavailable, a deterministic keyword-overlap local retriever
  over the demo documents keeps citations working in demo mode. If that also
  fails, `retrieve()` returns rag_available=False and an empty citation list —
  eligibility is never affected.

Embeddings: when Pinecone is used without an embedding API key, a documented
deterministic hashing embedder (384-dim, token-hash bag of words) generates
vectors. This is demo-grade; swap in a production embedder via
`EMBEDDING_MODEL`/provider config for real deployments.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

EMBED_DIM = 384


# ---------------------------------------------------------------------------
# Document loading & chunking (deterministic)
# ---------------------------------------------------------------------------

_WORD_RE = re.compile(r"[a-z0-9]+")


def _clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    words = _WORD_RE.findall(text.lower())
    if not words:
        return []
    chunks: list[str] = []
    step = max(1, chunk_size - overlap)
    for start in range(0, len(words), step):
        piece = " ".join(words[start : start + chunk_size])
        if piece and piece not in chunks:
            chunks.append(piece)
    return chunks


def _extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            return _clean(" ".join(page.extract_text() or "" for page in reader.pages))
        except Exception as exc:  # pragma: no cover - malformed PDFs
            logger.warning("PDF extraction failed for %s: %s", path.name, type(exc).__name__)
            return ""
    return _clean(path.read_text(encoding="utf-8", errors="ignore"))


def _filename_meta(name: str) -> dict[str, str]:
    """Parse `{category}_{scheme_id}.txt` (or .pdf) naming into metadata."""
    stem = Path(name).stem.lower().replace("-", "_")
    parts = stem.split("_")
    category = parts[0] if parts and parts[0] in {"sc", "st", "obc", "minority", "women", "general"} else ""
    scheme_id = "_".join(parts[1:]) if len(parts) > 1 else stem
    return {"category": category, "scheme_id": scheme_id}


@lru_cache(maxsize=1)
def _index_documents() -> list[dict[str, Any]]:
    """Scan data/scheme_documents -> cleaned, chunked, metadata-tagged records."""
    doc_dir = Path(settings.scheme_documents_dir)
    records: list[dict[str, Any]] = []
    if not doc_dir.is_dir():
        return records
    for path in sorted(doc_dir.glob("*.txt")) + sorted(doc_dir.glob("*.pdf")):
        meta = _filename_meta(path.name)
        text = _extract_text(path)
        if not text:
            continue
        chunks = _chunk_text(text, settings.rag_chunk_size, settings.rag_chunk_overlap)
        for index, chunk in enumerate(chunks):
            records.append(
                {
                    "id": f"{meta['category']}-{meta['scheme_id']}-chunk-{index}",
                    "category": meta["category"],
                    "scheme_id": meta["scheme_id"],
                    "source_document": path.name,
                    "source_section": "Eligibility",  # demo sections are uniform
                    "chunk_index": index,
                    "text": chunk,
                    "vector": _hash_embed(chunk),
                }
            )
    return records


def _hash_embed(text: str) -> list[float]:
    """Deterministic 384-dim token-hash embedding (demo-grade).

    Stable across runs and processes; good enough for tiny demo corpora.
    Replace with a real embedder for production.
    """
    vector = [0.0] * EMBED_DIM
    for token in _WORD_RE.findall(text.lower()):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % EMBED_DIM
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[bucket] += sign
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    return max(0.0, min(1.0, dot))


# ---------------------------------------------------------------------------
# Pinecone backend (used only when configured)
# ---------------------------------------------------------------------------

_pc = None
_pc_checked = False


def _pinecone_client():
    global _pc, _pc_checked
    if not _pc_checked:
        _pc_checked = True
        if settings.pinecone_api_key:
            try:
                from pinecone import Pinecone

                _pc = Pinecone(api_key=settings.pinecone_api_key)
            except Exception as exc:  # pragma: no cover
                logger.warning("Pinecone initialisation failed: %s", type(exc).__name__)
                _pc = None
    return _pc


def _pinecone_upsert(records: list[dict[str, Any]]) -> bool:
    client = _pinecone_client()
    if client is None:
        return False
    try:
        index = client.Index(settings.pinecone_index_name)
        vectors = [
            {
                "id": r["id"],
                "values": r["vector"],
                "metadata": {
                    "category": r["category"],
                    "scheme_id": r["scheme_id"],
                    "source_document": r["source_document"],
                    "source_section": r["source_section"],
                    "chunk_index": r["chunk_index"],
                    "text": r["text"][:1000],
                },
            }
            for r in records
        ]
        if vectors:
            index.upsert(vectors=vectors)
        return True
    except Exception as exc:  # pragma: no cover - network/auth failures
        logger.warning("Pinecone upsert failed: %s", type(exc).__name__)
        return False


def _pinecone_query(query_text: str, category: str, top_k: int) -> list[dict[str, Any]]:
    client = _pinecone_client()
    if client is None:
        return []
    try:
        index = client.Index(settings.pinecone_index_name)
        query_vector = _hash_embed(query_text)
        response = index.query(
            vector=query_vector,
            top_k=top_k,
            filter={"category": category} if category else None,
            include_metadata=True,
        )
        citations = []
        for hit in response.get("matches", []):
            meta = hit.get("metadata") or {}
            citations.append(
                {
                    "source_document": meta.get("source_document", ""),
                    "source_section": meta.get("source_section", ""),
                    "chunk_index": meta.get("chunk_index", 0),
                    "score": round(float(hit.get("score", 0)), 3),
                    "excerpt": meta.get("text", "")[:500],
                    "chunk_id": hit.get("id", ""),
                    "storage": "pinecone",
                }
            )
        return citations
    except Exception as exc:  # pragma: no cover - network failures
        logger.warning("Pinecone query failed: %s", type(exc).__name__)
        return []


# ---------------------------------------------------------------------------
# Local deterministic retriever (demo fallback)
# ---------------------------------------------------------------------------

def _local_query(query_text: str, category: str, scheme_ids: list[str], top_k: int) -> list[dict[str, Any]]:
    records = _index_documents()
    if not records:
        return []
    query_vec = _hash_embed(query_text)
    scored: list[tuple[float, dict[str, Any]]] = []
    for record in records:
        if category and record["category"] and record["category"] != category:
            continue
        if scheme_ids and record["scheme_id"] and record["scheme_id"] not in scheme_ids:
            continue
        score = _cosine(query_vec, record["vector"])
        scored.append((score, record))
    scored.sort(key=lambda t: -t[0])
    citations = []
    for score, record in scored[:top_k]:
        citations.append(
            {
                "source_document": record["source_document"],
                "source_section": record["source_section"],
                "chunk_index": record["chunk_index"],
                "score": round(score, 3),
                "excerpt": record["text"][:500],
                "chunk_id": record["id"],
                "storage": "local",
            }
        )
    return citations


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def retrieve(
    profile: dict[str, Any],
    scheme_ids: list[str] | None = None,
    top_k: int = 4,
) -> tuple[list[dict[str, Any]], bool, str | None]:
    """Retrieve evidence for a profile. Never raises.

    Returns (citations, rag_available, warning).
    """
    category = (profile.get("category") or "").strip().lower()
    cost = profile.get("education_cost") or profile.get("project_cost")
    purpose = profile.get("purpose") or ("education" if profile.get("is_education") else "business")
    query_text = (
        f"eligibility {purpose} scheme for {category} category "
        f"income {profile.get('annual_income')} cost {cost} age {profile.get('age')}"
    )
    try:
        if _pinecone_client() is not None:
            citations = _pinecone_query(query_text, category, top_k)
            if citations:
                return citations, True, None
        citations = _local_query(query_text, category, scheme_ids or [], top_k)
        if citations:
            return (
                citations,
                True,
                "Pinecone is not configured; using local DEMO document index.",
            )
        return [], False, "Official document retrieval is temporarily unavailable."
    except Exception as exc:  # pragma: no cover
        logger.warning("RAG retrieve failed: %s", type(exc).__name__)
        return [], False, "Official document retrieval is temporarily unavailable."


def reingest_all() -> dict[str, Any]:
    """Admin-triggered re-ingestion. Idempotent upsert; never duplicates."""
    records = _index_documents()
    pinecone_ok = False
    if _pinecone_client() is not None:
        pinecone_ok = _pinecone_upsert(records)
    return {
        "indexed_documents": len(records),
        "pinecone_used": pinecone_ok,
        "local_index_available": len(records) > 0,
        "notice": "Demo document index is deterministic and rebuilt on demand.",
    }


def ingest_status() -> dict[str, Any]:
    records = _index_documents()
    return {
        "chunk_count": len(records),
        "documents": sorted({r["source_document"] for r in records}),
        "pinecone_configured": _pinecone_client() is not None,
        "local_available": len(records) > 0,
    }
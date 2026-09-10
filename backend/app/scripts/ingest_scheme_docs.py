"""Ingest / re-ingest scheme documents into the RAG index.

Usage:
    python -m app.scripts.ingest_scheme_docs

Pipeline: document -> text extraction -> cleaning -> chunking -> embedding ->
Pinecone (if configured) / deterministic local index. Stable chunk IDs make
re-ingestion idempotent — no uncontrolled duplicates.
"""

from __future__ import annotations

import sys

from app.ai import rag_service
from app.utils.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


def main() -> int:
    logger.info("Starting scheme document ingestion...")
    result = rag_service.reingest_all()
    logger.info(
        "Ingestion complete: %s chunks, pinecone_used=%s, local_available=%s",
        result["indexed_documents"],
        result["pinecone_used"],
        result["local_index_available"],
    )
    print(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
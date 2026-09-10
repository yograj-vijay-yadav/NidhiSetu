# Scheme Documents (DEMO corpus)

Real government scheme documents/circulars are **not** bundled with this
project. The files in this folder are **DEMO / PLACEHOLDER documents** written
for the NidhiSetu college project so the RAG pipeline can be demonstrated
end-to-end (chunking, stable IDs, metadata filtering, citations).

Convention: `{category}_{scheme_id}.txt` (or `.pdf`). Each chunk gets stable
ID `{category}-{scheme_id}-chunk-{index}` and metadata
`{category, scheme_id, source_document, source_section, chunk_index}`.

To use real documents:
1. Drop official PDFs/guideline files into this folder using the same naming
   convention (or extend `app/ai/rag_service.py`).
2. Configure `PINECONE_API_KEY` + `PINECONE_INDEX_NAME` (or rely on the local
   demo index).
3. Call `POST /api/admin/schemes/reingest` (admin-only) or run
   `python -m app.scripts.ingest_scheme_docs`.

Nothing in this folder is official government policy.
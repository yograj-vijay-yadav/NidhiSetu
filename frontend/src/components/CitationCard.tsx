import { FileText } from "lucide-react";
import { Citation } from "../lib/types";

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <FileText className="h-3.5 w-3.5 text-saffron" />
        <span className="font-semibold text-slate-700">{citation.source_document}</span>
        <span className="mx-1">·</span>
        <span>Section: {citation.source_section}</span>
        <span className="mx-1">·</span>
        <span>chunk {citation.chunk_index}</span>
        <span className="ml-auto rounded bg-white border border-slate-200 px-1.5 py-0.5">
          {citation.storage === "pinecone" ? "Pinecone" : "local demo index"}
        </span>
      </div>
      <blockquote className="mt-2 text-sm text-slate-600 italic border-l-2 border-saffron/50 pl-3">
        “{citation.excerpt}”
      </blockquote>
    </div>
  );
}
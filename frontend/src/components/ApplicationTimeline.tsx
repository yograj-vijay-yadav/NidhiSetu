"use client";

import { ApplicationStatus, StatusHistoryEntry } from "../lib/types";
import { formatDate, statusLabel } from "../lib/utils";

const FLOW: ApplicationStatus[] = [
  "analysis_completed",
  "ready_to_apply",
  "application_started",
  "documents_submitted",
  "under_review",
  "approved",
  "rejected",
];

export function ApplicationTimeline({ history, current }: { history: StatusHistoryEntry[]; current: ApplicationStatus }) {
  const reached = new Set(history.map((h) => h.status));

  return (
    <ol className="space-y-0">
      {FLOW.map((status, index) => {
        const entry = history.find((h) => h.status === status);
        const isCurrent = status === current;
        const done = reached.has(status as ApplicationStatus);
        const isTerminal = status === "approved" || status === "rejected";
        return (
          <li key={status} className="relative flex gap-3 pb-4 last:pb-0">
            {index < FLOW.length - 1 && (
              <span
                className={`absolute left-[7px] top-4 h-full w-0.5 ${done && !isTerminal ? "bg-emerald" : "bg-slate-200"}`}
              />
            )}
            <span
              className={`relative mt-1 h-4 w-4 rounded-full border-2 shrink-0 ${
                done
                  ? isTerminal
                    ? status === "approved"
                      ? "bg-emerald border-emerald"
                      : "bg-red-600 border-red-600"
                    : "bg-emerald border-emerald"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className={isCurrent ? "font-semibold text-slate-800" : "text-slate-500"}>
              <p className="text-sm">{statusLabel(status)}</p>
              {entry && (
                <p className="text-xs text-slate-400">
                  {formatDate(entry.at)}
                  {entry.note ? ` — ${entry.note}` : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
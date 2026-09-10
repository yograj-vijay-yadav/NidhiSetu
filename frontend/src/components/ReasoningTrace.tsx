"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { ReasoningTraceStep } from "../lib/types";

export function ReasoningTrace({ steps }: { steps: ReasoningTraceStep[] }) {
  const [open, setOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="nidhi-card p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="font-bold text-slate-800">How NidhiSetu reached this result</h3>
          <p className="text-xs text-slate-400">
            High-level decision trace only — never hidden chain-of-thought.
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="mt-4 space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <span className="text-slate-600">
                <span className="font-semibold text-slate-700">{step.agent}:</span>{" "}
                {step.action}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
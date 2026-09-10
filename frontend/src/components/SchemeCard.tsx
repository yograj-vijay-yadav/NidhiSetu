"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { EligibilityResult } from "../lib/types";
import { EligibilityBadge } from "./EligibilityBadge";
import { Card } from "./ui";
import { formatINR } from "../lib/utils";
import { useSchemeMeta } from "../hooks/useSchemes";

export function SchemeCard({
  result,
  recommended = false,
}: {
  result: EligibilityResult;
  recommended?: boolean;
}) {
  const meta = useSchemeMeta(result.scheme_id);

  return (
    <Card accent={recommended} className={recommended ? "border-saffron" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {recommended && (
              <span className="nidhi-badge bg-navy text-white">Recommended</span>
            )}
            <h3 className="font-bold text-slate-800">{result.scheme_name}</h3>
          </div>
          <EligibilityBadge status={result.status} score={result.score} />
        </div>
      </div>

      {meta && (
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-xs">
          <div>
            <dt className="text-slate-400">Interest</dt>
            <dd className="font-semibold text-slate-700">{(meta.interest_rate * 100).toFixed(1)}% p.a.</dd>
          </div>
          <div>
            <dt className="text-slate-400">Tenure</dt>
            <dd className="font-semibold text-slate-700">{meta.tenure_years} yrs</dd>
          </div>
          <div>
            <dt className="text-slate-400">Financing</dt>
            <dd className="font-semibold text-slate-700">{Math.round(meta.loan_percentage * 100)}%</dd>
          </div>
          <div>
            <dt className="text-slate-400">Income cap</dt>
            <dd className="font-semibold text-slate-700">
              {meta.income_cap !== null ? formatINR(meta.income_cap) : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Project cap</dt>
            <dd className="font-semibold text-slate-700">
              {meta.max_project_cost !== null ? formatINR(meta.max_project_cost) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Moratorium</dt>
            <dd className="font-semibold text-slate-700">{meta.moratorium_months} months</dd>
          </div>
        </dl>
      )}

      <ul className="mt-4 space-y-1.5 text-sm">
        {result.checks.map((check) => (
          <li key={check.rule} className="flex items-start gap-2">
            {check.result ? (
              <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span className="text-slate-600">{check.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
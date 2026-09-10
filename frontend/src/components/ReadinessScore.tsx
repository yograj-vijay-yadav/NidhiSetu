import { Readiness } from "../lib/types";

const LABELS: [keyof Readiness["breakdown"], string][] = [
  ["eligibility", "Eligibility"],
  ["required_information", "Required information"],
  ["documents", "Documents"],
  ["scheme_match", "Scheme match"],
  ["partner_availability", "Partner availability"],
];

export function ReadinessScore({ readiness }: { readiness: Readiness }) {
  if (!readiness) return null;
  const score = readiness.score ?? 0;

  return (
    <div>
      <div className="flex items-end gap-4 mb-4">
        <span className="text-5xl font-extrabold text-slate-800">{score}</span>
        <span className="text-sm text-slate-400 mb-1.5">/ 100</span>
        <span className="ml-auto text-xs text-slate-400">deterministic · documented weights</span>
      </div>
      <div className="space-y-2.5">
        {LABELS.map(([key, label]) => {
          const value = readiness.breakdown?.[key] ?? 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                <span>{label}</span>
                <span className="font-semibold">{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${value >= 75 ? "bg-emerald" : value >= 50 ? "bg-saffron" : "bg-red-400"}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
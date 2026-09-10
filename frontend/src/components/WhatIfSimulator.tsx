"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { api } from "../lib/api";
import { BeneficiaryProfile, EligibilityResult } from "../lib/types";
import { formatINR } from "../lib/utils";
import { EligibilityBadge } from "./EligibilityBadge";
import { Spinner } from "./ui";

export function WhatIfSimulator({ profile }: { profile: BeneficiaryProfile }) {
  const [cost, setCost] = useState<number>(
    (profile.education_cost ?? profile.project_cost) ?? 150000
  );
  const [income, setIncome] = useState<number>(profile.annual_income ?? 250000);
  const [age, setAge] = useState<number>(profile.age ?? 30);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEducation = profile.is_education;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      api
        .whatIf(profile, {
          project_cost: isEducation ? undefined : cost,
          education_cost: isEducation ? cost : undefined,
          annual_income: income,
          age,
        })
        .then((res) => {
          if (!cancelled) setResults(res.results);
        })
        .catch(() => {
          if (!cancelled) setError("Simulator request failed.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250); // debounce
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cost, income, age, isEducation, profile]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-saffron" />
        <h3 className="font-bold text-slate-800">What-if simulator</h3>
        <span className="text-xs text-slate-400 ml-auto">
          deterministic rule engine · no LLM
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="nidhi-label">
            {isEducation ? "Education cost" : "Project cost"}: {formatINR(cost, true)}
          </label>
          <input
            type="range"
            min={50000}
            max={isEducation ? 2500000 : 5500000}
            step={10000}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-full accent-saffron"
          />
        </div>
        <div>
          <label className="nidhi-label">Annual income: {formatINR(income, true)}</label>
          <input
            type="range"
            min={0}
            max={1000000}
            step={10000}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full accent-saffron"
          />
        </div>
        <div>
          <label className="nidhi-label">Age: {age}</label>
          <input
            type="range"
            min={16}
            max={65}
            step={1}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-saffron"
          />
        </div>
      </div>

      {loading && <Spinner label="Re-evaluating…" />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && results && (
        <div className="space-y-2">
          {results.slice(0, 4).map((result) => (
            <div
              key={result.scheme_id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5"
            >
              <div>
                <span className="font-semibold text-slate-800 text-sm">{result.scheme_name}</span>
                {result.near_threshold_fields.length > 0 && (
                  <span className="ml-2 text-xs text-amber-600">near threshold</span>
                )}
              </div>
              <EligibilityBadge status={result.status} score={result.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
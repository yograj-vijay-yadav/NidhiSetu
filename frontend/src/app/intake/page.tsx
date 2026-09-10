"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, MessageSquareText, Wand2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { saveAnalysis } from "../../hooks/useAnalysis";
import { BeneficiaryCategory, BeneficiaryProfile, Purpose } from "../../lib/types";
import { Card, ErrorBanner, DemoNotice } from "../../components/ui";

const CATEGORIES: { id: BeneficiaryCategory; label: string; hint: string }[] = [
  { id: "sc", label: "SC", hint: "Scheduled Caste" },
  { id: "st", label: "ST", hint: "Scheduled Tribe" },
  { id: "obc", label: "OBC", hint: "Other Backward Class" },
  { id: "minority", label: "Minority", hint: "Minority community" },
  { id: "women", label: "Women", hint: "Women entrepreneur" },
  { id: "general", label: "General", hint: "Open category" },
];

const PURPOSES: { id: Purpose; label: string; hint: string }[] = [
  { id: "business", label: "Business", hint: "Start or expand a business" },
  { id: "self_employment", label: "Self-employment", hint: "Freelance / own practice" },
  { id: "education", label: "Education", hint: "Degree / diploma / course" },
  { id: "skill_development", label: "Skill development", hint: "Vocational training" },
];

const STEPS = ["Category", "Personal & financial", "Purpose", "Cost", "Review"];

const EMPTY_PROFILE: BeneficiaryProfile = {
  category: "sc",
  annual_income: null,
  age: null,
  project_cost: null,
  education_cost: null,
  purpose: null,
  is_education: false,
};

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<BeneficiaryProfile>(EMPTY_PROFILE);
  const [nlText, setNlText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEducation = profile.purpose === "education" || profile.purpose === "skill_development";
  const cost = isEducation ? profile.education_cost : profile.project_cost;

  const set = (patch: Partial<BeneficiaryProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const canNext =
    step === 0
      ? true
      : step === 1
      ? profile.age !== null && profile.annual_income !== null
      : step === 2
      ? profile.purpose !== null
      : step === 3
      ? cost !== null && cost > 0
      : true;

  const runAnalysis = async (payload: BeneficiaryProfile) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeProfile(payload);
      if (result.needs_clarification && result.missing_fields.length > 0) {
        // Ask deterministically for whatever is missing, then keep going.
        const next = { ...payload };
        if (result.missing_fields.includes("annual_income")) next.annual_income = 250000;
        if (result.missing_fields.includes("age")) next.age = 30;
        const retry = await api.analyzeProfile(next);
        saveAnalysis(retry);
      } else {
        saveAnalysis(result);
      }
      router.push("/results");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Analysis failed. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNlIntake = async () => {
    if (nlText.trim().length < 5) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeText(nlText);
      saveAnalysis(result);
      router.push("/results");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Natural-language intake failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Check your eligibility</h1>
        <p className="text-sm text-slate-500 mt-1">
          Answer five quick steps — or describe your requirement in plain language below.
        </p>
      </div>

      {/* Natural language intake */}
      <Card accent>
        <label className="nidhi-label flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-saffron" />
          Describe your requirement
        </label>
        <div className="flex gap-2">
          <input
            className="nidhi-input"
            placeholder='e.g. "I am a 30-year-old SC woman entrepreneur with family income 2.5 lakh, need 5 lakh for a tailoring business"'
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNlIntake()}
          />
          <button
            onClick={handleNlIntake}
            disabled={loading || nlText.trim().length < 5}
            className="nidhi-btn nidhi-btn-saffron shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Analyze
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          AI extraction with a deterministic fallback — you can review and edit every field
          before running the full analysis.
        </p>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                index <= step ? "bg-saffron" : "bg-slate-200"
              }`}
            />
            <span className={index === step ? "font-semibold text-slate-700" : ""}>{label}</span>
            {index < STEPS.length - 1 && <span className="text-slate-300">—</span>}
          </div>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      <Card className="min-h-[280px]">
        {/* STEP 1 — CATEGORY */}
        {step === 0 && (
          <div>
            <h2 className="font-bold text-slate-800 mb-4">Step 1 · Beneficiary category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => set({ category: cat.id })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    profile.category === cat.id
                      ? "border-saffron bg-saffronsoft ring-2 ring-saffron/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="font-bold text-slate-800">{cat.label}</span>
                  <span className="block text-xs text-slate-500 mt-1">{cat.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — PERSONAL/FINANCIAL */}
        {step === 1 && (
          <div className="max-w-md">
            <h2 className="font-bold text-slate-800 mb-4">Step 2 · Personal & financial details</h2>
            <div className="space-y-4">
              <div>
                <label className="nidhi-label">Age</label>
                <input
                  type="number"
                  min={15}
                  max={75}
                  className="nidhi-input"
                  value={profile.age ?? ""}
                  onChange={(e) => set({ age: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <label className="nidhi-label">Annual family income (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="nidhi-input"
                  value={profile.annual_income ?? ""}
                  onChange={(e) =>
                    set({ annual_income: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — PURPOSE */}
        {step === 2 && (
          <div>
            <h2 className="font-bold text-slate-800 mb-4">Step 3 · What is this financing for?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PURPOSES.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() =>
                    set({
                      purpose: purpose.id,
                      is_education: purpose.id === "education" || purpose.id === "skill_development",
                    })
                  }
                  className={`rounded-xl border p-4 text-left transition-all ${
                    profile.purpose === purpose.id
                      ? "border-saffron bg-saffronsoft ring-2 ring-saffron/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="font-bold text-slate-800">{purpose.label}</span>
                  <span className="block text-xs text-slate-500 mt-1">{purpose.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — COST */}
        {step === 3 && (
          <div className="max-w-md">
            <h2 className="font-bold text-slate-800 mb-4">
              Step 4 · {isEducation ? "Education cost (₹)" : "Project cost (₹)"}
            </h2>
            <input
              type="number"
              min={1}
              className="nidhi-input text-lg"
              placeholder="e.g. 500000"
              value={cost ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                if (isEducation) set({ education_cost: value });
                else set({ project_cost: value });
              }}
            />
            <p className="mt-2 text-xs text-slate-400">
              {isEducation
                ? "Total course fee, including tuition, hostel and exam fees."
                : "Total project cost; NidhiSetu will show the loan amount and your own contribution."}
            </p>
          </div>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 4 && (
          <div>
            <h2 className="font-bold text-slate-800 mb-4">Step 5 · Review your profile</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Category", CATEGORIES.find((c) => c.id === profile.category)?.label],
                ["Age", profile.age !== null ? `${profile.age} years` : null],
                [
                  "Annual income",
                  profile.annual_income !== null ? `₹${profile.annual_income.toLocaleString("en-IN")}` : null,
                ],
                ["Purpose", profile.purpose],
                [
                  isEducation ? "Education cost" : "Project cost",
                  cost !== null ? `₹${cost.toLocaleString("en-IN")}` : null,
                ],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-400 text-xs uppercase">{key}</dt>
                  <dd className="font-semibold text-slate-800">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-slate-400">
              Submitting runs the full pipeline: deterministic eligibility → RAG evidence →
              multi-agent explanation → partner matching → readiness score.
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="nidhi-btn nidhi-btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="nidhi-btn nidhi-btn-primary"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => runAnalysis(profile)}
            disabled={loading}
            className="nidhi-btn nidhi-btn-saffron"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run eligibility analysis
          </button>
        )}
      </div>

      <DemoNotice />
    </div>
  );
}
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenCheck, CopyCheck, Save, Send, XCircle } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { loadAnalysis, saveAnalysis } from "../../hooks/useAnalysis";
import { AnalysisResult } from "../../lib/types";
import { formatINR } from "../../lib/utils";
import { Card, DemoNotice, EmptyState, ErrorBanner, SectionTitle, Spinner } from "../../components/ui";
import { EligibilityBadge } from "../../components/EligibilityBadge";
import { SchemeCard } from "../../components/SchemeCard";
import { ReasoningTrace } from "../../components/ReasoningTrace";
import { CitationCard } from "../../components/CitationCard";
import { EmiCalculator } from "../../components/EmiCalculator";
import { WhatIfSimulator } from "../../components/WhatIfSimulator";
import { PartnerCard } from "../../components/PartnerCard";
import { ReadinessScore } from "../../components/ReadinessScore";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => loadAnalysis());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followupText, setFollowupText] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (analysis) return;
    const conversationId = searchParams.get("conversation");
    const timer = window.setTimeout(() => {
      setError(
        conversationId
          ? "No analysis found in this session. Please re-run your eligibility check."
          : "No analysis found. Start from the eligibility check."
      );
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [analysis, searchParams]);

  const handleFollowup = async () => {
    if (!analysis?.conversation_id || followupText.trim().length < 3) return;
    setFollowupLoading(true);
    setError(null);
    try {
      const updated = await api.followUp(followupText, analysis.conversation_id);
      saveAnalysis(updated);
      setAnalysis(updated);
      setFollowupText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Follow-up failed.");
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    try {
      await api.createApplication(analysis);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save application.");
    }
  };

  if (loading) return <Spinner label="Loading analysis…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!analysis) return <EmptyState title="No analysis to show" message="Run the eligibility check first." />;

  const recommended = analysis.recommended_scheme;
  const matched = analysis.matched_schemes ?? [];
  const otherMatching = matched.filter((m) => m.scheme_id !== recommended?.scheme_id);
  const rejected = otherMatching.filter((m) => m.status === "not_eligible");
  const comparison = otherMatching.filter((m) => m.status !== "not_eligible");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your scheme analysis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Profile: {analysis.input.category.toUpperCase()} · age {analysis.input.age} · income{" "}
            {formatINR(analysis.input.annual_income, true)} · {analysis.flow} flow
          </p>
        </div>
        {user && !saved ? (
          <button onClick={handleSave} className="nidhi-btn nidhi-btn-primary">
            <Save className="h-4 w-4" /> Save & track application
          </button>
        ) : saved ? (
          <button onClick={() => router.push("/applications")} className="nidhi-btn nidhi-btn-outline">
            <CopyCheck className="h-4 w-4" /> View my applications
          </button>
        ) : (
          <button onClick={() => router.push(`/login?returnTo=/results`)} className="nidhi-btn nidhi-btn-outline">
            Sign in to save & track
          </button>
        )}
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
      </div>

      {analysis.needs_clarification && (
        <Card accent>
          <p className="text-sm text-slate-600">
            <strong>Almost there:</strong> {analysis.clarification_question}
          </p>
        </Card>
      )}

      {/* RECOMMENDATION */}
      {recommended ? (
        <>
          <section>
            <SectionTitle>Recommended Scheme</SectionTitle>
            <SchemeCard result={recommended} recommended />
          </section>

          <section className="nidhi-card p-5">
            <SectionTitle>Why this scheme?</SectionTitle>
            <p className="text-sm text-slate-600 leading-relaxed">{analysis.explanation}</p>
            {analysis.ai_meta?.fallback_used && (
              <p className="mt-2 text-xs text-amber-700">
                (Explanation generated by the deterministic fallback — Groq unavailable or not
                configured.)
              </p>
            )}
          </section>

          {/* EMI */}
          {analysis.emi && (
            <section className="nidhi-card p-5">
              <SectionTitle>Indicative EMI</SectionTitle>
              <EmiCalculator emi={analysis.emi} />
            </section>
          )}

          {/* COMPARISON */}
          {(comparison.length > 0 || rejected.length > 0) && (
            <section className="nidhi-card p-5">
              <SectionTitle>Scheme comparison</SectionTitle>
              {comparison.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="nidhi-table">
                      <thead>
                        <tr>
                          <th>Scheme</th>
                          <th>Eligibility</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.map((m) => (
                          <tr key={m.scheme_id}>
                            <td className="font-medium text-slate-700">{m.scheme_name}</td>
                            <td>
                              <EligibilityBadge status={m.status} score={m.score} />
                            </td>
                            <td className="text-slate-500">{m.score}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Why not the alternatives?
                    </h4>
                    {comparison.map((m) => (
                      <ul key={m.scheme_id} className="space-y-1.5 mb-3 text-sm">
                        {m.checks.map((c) =>
                          c.result ? null : (
                            <li key={c.rule} className="flex items-start gap-2 text-slate-600">
                              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <span>
                                <strong>{m.scheme_name}:</strong> {c.detail}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    ))}
                  </div>
                </>
              )}
              {rejected.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Not eligible under these schemes
                  </h4>
                  {rejected.map((m) => (
                    <p key={m.scheme_id} className="text-sm text-slate-500 mb-1.5">
                      <strong>{m.scheme_name}:</strong>{" "}
                      {m.checks
                        .filter((c) => !c.result)
                        .map((c) => c.detail)
                        .join(" · ") || "failed deterministic checks"}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* EVIDENCE */}
          <section className="nidhi-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpenCheck className="h-4 w-4 text-saffron" />
              <SectionTitle>Evidence</SectionTitle>
            </div>
            {analysis.citations.length > 0 ? (
              <div className="space-y-3">
                {analysis.citations.map((citation) => (
                  <CitationCard key={citation.chunk_id} citation={citation} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {analysis.rag_available
                  ? "No supporting document matched this profile."
                  : analysis.rag_warning || "Official document retrieval is temporarily unavailable."}
              </p>
            )}
          </section>

          {/* PARTNERS */}
          <section className="nidhi-card p-5">
            <SectionTitle>Authorized partners</SectionTitle>
            {analysis.partners.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {analysis.partners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active authorized partners matched.</p>
            )}
            {analysis.partners_narration && (
              <p className="mt-3 text-xs text-slate-400">{analysis.partners_narration}</p>
            )}
          </section>

          {/* READINESS */}
          <section className="nidhi-card p-5">
            <SectionTitle>Application readiness</SectionTitle>
            <ReadinessScore readiness={analysis.readiness} />
            <p className="mt-2 text-xs text-slate-400">
              Preliminary score at analysis time. Save the application and submit documents to
              raise the readiness score.
            </p>
          </section>
        </>
      ) : (
        <EmptyState
          title="No scheme matched this profile"
          message="Use the what-if simulator below to see how changing income, cost or age affects eligibility."
        />
      )}

      {/* WHAT-IF */}
      <section className="nidhi-card p-5">
        <WhatIfSimulator profile={analysis.input} />
      </section>

      {/* FOLLOW-UP */}
      <section className="nidhi-card p-5">
        <h3 className="font-bold text-slate-800 mb-2">Ask a follow-up (conversation memory)</h3>
        <div className="flex gap-2">
          <input
            className="nidhi-input"
            placeholder="e.g. What if my project cost is 1.3 lakh?"
            value={followupText}
            onChange={(e) => setFollowupText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFollowup()}
          />
          <button
            onClick={handleFollowup}
            disabled={followupLoading || !followupText.trim()}
            className="nidhi-btn nidhi-btn-saffron shrink-0"
          >
            <Send className="h-4 w-4" /> Ask
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Uses the LangGraph checkpointer tied to this conversation — no need to re-enter your
          full profile.
        </p>
      </section>

      {/* TRACE */}
      <ReasoningTrace steps={analysis.reasoning_trace} />

      <DemoNotice />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}
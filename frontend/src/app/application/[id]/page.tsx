"use client";

import { Suspense, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { Application, ApplicationStatus } from "../../../lib/types";
import { formatINR, statusLabel } from "../../../lib/utils";
import { Card, DemoNotice, ErrorBanner, SectionTitle, Spinner } from "../../../components/ui";
import { EligibilityBadge } from "../../../components/EligibilityBadge";
import { EmiCalculator } from "../../../components/EmiCalculator";
import { CitationCard } from "../../../components/CitationCard";
import { PartnerCard } from "../../../components/PartnerCard";
import { ReadinessScore } from "../../../components/ReadinessScore";
import { ApplicationTimeline } from "../../../components/ApplicationTimeline";

const NEXT_STEP: Record<ApplicationStatus, ApplicationStatus | null> = {
  analysis_completed: "ready_to_apply",
  ready_to_apply: "application_started",
  application_started: "documents_submitted",
  documents_submitted: "under_review",
  under_review: null, // decision chosen by admin/user via buttons
  approved: null,
  rejected: null,
};

const DOC_LABELS: Record<string, string> = {
  identity_proof: "Identity proof",
  address_proof: "Address proof",
  category_certificate: "Category / caste certificate",
  income_certificate: "Income certificate",
  bank_details: "Bank account details",
  project_report: "Project report",
  admission_letter: "Admission letter / fee structure",
};

function ApplicationDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = () => {
    api
      .getApplication(id)
      .then(setApp)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 403
            ? "You do not have access to this application."
            : "Failed to load application."
        )
      );
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?returnTo=/application/${id}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const advance = async (status: ApplicationStatus) => {
    setWorking(true);
    try {
      setApp(await api.updateApplicationStatus(id, status));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status update failed.");
    } finally {
      setWorking(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (!app) return <Spinner label="Loading application…" />;

  const next = NEXT_STEP[app.status];

  return (
    <div className="space-y-6 max-w-5xl">
      <button onClick={() => router.push("/applications")} className="nidhi-btn nidhi-btn-ghost">
        <ArrowLeft className="h-4 w-4" /> All applications
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {app.recommended_scheme?.scheme_name || "Application"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {app.category?.toUpperCase()} · created {new Date(app.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span
          className={`nidhi-badge text-sm ${
            app.status === "approved"
              ? "badge-eligible"
              : app.status === "rejected"
              ? "badge-not-eligible"
              : "badge-insufficient"
          }`}
        >
          {statusLabel(app.status)}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT: input + eligibility + EMI + evidence + partners */}
        <div className="lg:col-span-2 space-y-5">
          {app.recommended_scheme && (
            <Card accent>
              <SectionTitle>Eligibility result</SectionTitle>
              <EligibilityBadge status={app.recommended_scheme.status} score={app.recommended_scheme.score} />
              <p className="mt-3 text-sm text-slate-600">{app.explanation}</p>
            </Card>
          )}

          <Card>
            <SectionTitle>Original input</SectionTitle>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                ["Category", app.category],
                ["Age", app.input.age !== null ? `${app.input.age} years` : null],
                ["Annual income", app.input.annual_income !== null ? formatINR(app.input.annual_income) : null],
                ["Purpose", app.input.purpose],
                [
                  app.input.is_education ? "Education cost" : "Project cost",
                  formatINR(app.input.is_education ? app.input.education_cost : app.input.project_cost),
                ],
              ].map(([key, value]) => (
                <div key={key as string}>
                  <dt className="text-xs uppercase text-slate-400">{key}</dt>
                  <dd className="font-semibold text-slate-800">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {app.emi && (
            <Card>
              <SectionTitle>EMI plan</SectionTitle>
              <EmiCalculator emi={app.emi} />
            </Card>
          )}

          {app.citations.length > 0 && (
            <Card>
              <SectionTitle>Evidence</SectionTitle>
              <div className="space-y-3">
                {app.citations.map((citation) => (
                  <CitationCard key={citation.chunk_id} citation={citation} />
                ))}
              </div>
            </Card>
          )}

          {app.partners.length > 0 && (
            <Card>
              <SectionTitle>Authorized partners</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {app.partners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: readiness + timeline + controls */}
        <div className="space-y-5">
          <Card>
            <SectionTitle>Application readiness</SectionTitle>
            <ReadinessScore readiness={app.readiness} />
          </Card>

          <Card>
            <SectionTitle>Timeline</SectionTitle>
            <ApplicationTimeline history={app.status_history} current={app.status} />
          </Card>

          <Card>
            <SectionTitle>Documents</SectionTitle>
            <div className="space-y-1.5">
              {Object.entries(DOC_LABELS).map(([key, label]) => {
                const checked = app.documents.includes(key);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-emerald"
                      checked={checked}
                      disabled={working}
                      onChange={async (e) => {
                        const nextDocs = e.target.checked
                          ? [...app.documents, key]
                          : app.documents.filter((d) => d !== key);
                        setWorking(true);
                        try {
                          setApp(await api.updateApplicationDocuments(id, nextDocs));
                        } catch (err) {
                          setError(err instanceof ApiError ? err.message : "Could not update documents.");
                        } finally {
                          setWorking(false);
                        }
                      }}
                    />
                    <span className={checked ? "text-slate-400 line-through" : "text-slate-700"}>
                      {label}
                    </span>
                    {checked && <Check className="h-3.5 w-3.5 text-emerald ml-auto" />}
                  </label>
                );
              })}
            </div>
          </Card>

          {next && (
            <button
              onClick={() => advance(next)}
              disabled={working}
              className="nidhi-btn nidhi-btn-saffron w-full"
            >
              Advance to “{statusLabel(next)}”
            </button>
          )}
          {app.status === "under_review" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => advance("approved")}
                disabled={working}
                className="nidhi-btn bg-emerald text-white"
              >
                Approve
              </button>
              <button
                onClick={() => advance("rejected")}
                disabled={working}
                className="nidhi-btn bg-red-600 text-white"
              >
                Reject
              </button>
            </div>
          )}

          <DemoNotice />
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <ApplicationDetailContent id={id} />
    </Suspense>
  );
}
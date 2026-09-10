"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Application } from "../../lib/types";
import { formatDate, formatINR, statusLabel } from "../../lib/utils";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui";

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?returnTo=/applications");
      return;
    }
    api
      .listApplications()
      .then(setApplications)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load applications."));
  }, [router]);

  if (error) return <ErrorBanner message={error} />;
  if (!applications) return <Spinner label="Loading applications…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My applications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every saved analysis is tracked here with its deterministic status flow.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Run the eligibility check, then press 'Save & track application' on the results page."
        />
      ) : (
        <div className="overflow-x-auto nidhi-card">
          <table className="nidhi-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Recommended scheme</th>
                <th>Requested amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="uppercase font-semibold text-slate-600">{app.category}</td>
                  <td className="text-slate-700">
                    {app.recommended_scheme?.scheme_name || "—"}
                    {app.recommended_scheme && (
                      <span className="ml-2 text-xs text-slate-400">
                        ({app.recommended_scheme.status})
                      </span>
                    )}
                  </td>
                  <td className="font-semibold text-slate-800">
                    {app.requested_amount ? formatINR(app.requested_amount) : "—"}
                  </td>
                  <td>
                    <span
                      className={`nidhi-badge ${
                        app.status === "approved"
                          ? "badge-eligible"
                          : app.status === "rejected"
                          ? "badge-not-eligible"
                          : "badge-insufficient"
                      }`}
                    >
                      {statusLabel(app.status)}
                    </span>
                  </td>
                  <td className="text-slate-500">{formatDate(app.created_at)}</td>
                  <td>
                    <Link
                      href={`/application/${app.id}`}
                      className="inline-flex items-center gap-1 text-saffron text-sm font-semibold hover:underline"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
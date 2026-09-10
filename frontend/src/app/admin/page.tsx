"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, Users } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { useAuth } from "../../hooks/useAuth";
import { AdminAnalytics } from "../../lib/types";
import { formatINR } from "../../lib/utils";
import {
  ApplicationsByMonthChart,
  SchemeDistributionChart,
  StatusDistributionChart,
} from "../../components/DashboardCharts";
import { Card, EmptyState, ErrorBanner, SectionTitle, Spinner } from "../../components/ui";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reingestMsg, setReingestMsg] = useState<string | null>(null);
  const [reingesting, setReingesting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?returnTo=/admin");
      return;
    }
    if (user && user.role !== "admin") {
      return;
    }
    api
      .adminAnalytics()
      .then(setStats)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 403
            ? "Admin access required — sign in with the Demo Admin account."
            : "Failed to load admin analytics."
        )
      );
  }, [router, user]);

  const handleReingest = async () => {
    setReingesting(true);
    try {
      const res = await api.reingest();
      setReingestMsg(
        `Indexed ${res.indexed_documents} chunk(s). ${res.pinecone_used ? "Stored in Pinecone." : "Local demo index used."}`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Re-ingestion failed.");
    } finally {
      setReingesting(false);
    }
  };

  if (user && user.role !== "admin") {
    return <ErrorBanner message="Admin access required — sign in with the Demo Admin account." />;
  }
  if (error) return <ErrorBanner message={error} />;
  if (!stats) return <Spinner label="Loading admin analytics…" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">National analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregates only — no private application data is exposed.
          </p>
        </div>
        <button onClick={handleReingest} disabled={reingesting} className="nidhi-btn nidhi-btn-outline">
          <DatabaseZap className="h-4 w-4" />
          {reingesting ? "Re-ingesting…" : "Re-ingest scheme documents"}
        </button>
      </div>
      {reingestMsg && <p className="text-sm text-emerald">{reingestMsg}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total users", value: String(stats.total_users) },
          { icon: DatabaseZap, label: "Total applications", value: String(stats.total_applications) },
          { icon: Users, label: "Popular category", value: stats.popular_category || "—" },
          {
            icon: DatabaseZap,
            label: "Avg requested amount",
            value: formatINR(stats.average_requested_amount, true),
          },
        ].map((card) => (
          <Card key={card.label} className="flex items-center gap-4">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-navy text-white shrink-0">
              <card.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{card.label}</p>
              <p className="font-bold text-lg text-slate-800 truncate">{card.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {stats.total_applications === 0 ? (
        <EmptyState title="No applications across the platform yet" />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>Applications by month</SectionTitle>
            <ApplicationsByMonthChart data={stats.applications_by_month} />
          </Card>
          <Card>
            <SectionTitle>Popular scheme: {stats.popular_scheme || "—"}</SectionTitle>
            <SchemeDistributionChart data={stats.scheme_distribution} />
          </Card>
          <Card className="lg:col-span-2">
            <SectionTitle>Status distribution</SectionTitle>
            <StatusDistributionChart data={stats.status_distribution} />
          </Card>
        </div>
      )}
    </div>
  );
}
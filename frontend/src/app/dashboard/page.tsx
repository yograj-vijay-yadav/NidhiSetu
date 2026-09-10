"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Gauge, IndianRupee, Target } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { useAuth } from "../../hooks/useAuth";
import { DashboardStats } from "../../lib/types";
import { formatINR } from "../../lib/utils";
import {
  ApplicationsByMonthChart,
  SchemeDistributionChart,
  StatusDistributionChart,
} from "../../components/DashboardCharts";
import { Card, EmptyState, ErrorBanner, SectionTitle, Spinner } from "../../components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?returnTo=/dashboard");
      return;
    }
    api
      .myDashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard."));
  }, [router]);

  if (error) return <ErrorBanner message={error} />;
  if (!stats) return <Spinner label="Loading dashboard…" />;

  const cards = [
    { icon: FileText, label: "Applications", value: String(stats.total_applications) },
    { icon: Gauge, label: "Potentially eligible", value: String(stats.potentially_eligible) },
    {
      icon: IndianRupee,
      label: "Total requested",
      value: formatINR(stats.total_requested_amount, true),
    },
    { icon: Target, label: "Most matched scheme", value: stats.most_matched_scheme || "—" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Your scheme discovery & application overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
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
        <EmptyState
          title="No applications yet"
          message="Run the eligibility check to create your first analysis."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>Applications by month</SectionTitle>
            <ApplicationsByMonthChart data={stats.applications_by_month} />
          </Card>
          <Card>
            <SectionTitle>Scheme distribution</SectionTitle>
            <SchemeDistributionChart data={stats.scheme_distribution} />
          </Card>
          <Card className="lg:col-span-2">
            <SectionTitle>Application status</SectionTitle>
            <StatusDistributionChart data={stats.status_distribution} />
          </Card>
        </div>
      )}
    </div>
  );
}
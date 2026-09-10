"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function Card({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={`nidhi-card p-5 ${accent ? "nidhi-card-accent" : ""} ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`nidhi-badge ${className}`}>{children}</span>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <p className="font-semibold text-slate-700">{title}</p>
      {message && <p className="mt-1 text-sm">{message}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function DemoNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <strong>Demo data:</strong> scheme rules and documents shown here are clearly-labelled
      placeholders. Verify everything against the latest official guidelines before applying.
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-slate-800 mb-3">{children}</h2>;
}
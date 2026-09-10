"use client";

import { AnalysisResult } from "../lib/types";

const KEY = "nidhisetu.analysis";

export function saveAnalysis(result: AnalysisResult): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalysisResult) : null;
  } catch {
    return null;
  }
}

export function clearAnalysis(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
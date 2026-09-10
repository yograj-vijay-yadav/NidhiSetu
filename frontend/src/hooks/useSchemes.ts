"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SchemeSummary } from "../lib/types";

let cache: Record<string, SchemeSummary> | null = null;
let inflight: Promise<Record<string, SchemeSummary>> | null = null;

function loadCatalogue(): Promise<Record<string, SchemeSummary>> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .listSchemes()
      .then((schemes) => {
        cache = Object.fromEntries(schemes.map((s) => [s.scheme_id, s]));
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useSchemeMeta(schemeId: string): SchemeSummary | null {
  const [meta, setMeta] = useState<SchemeSummary | null>(cache?.[schemeId] ?? null);

  useEffect(() => {
    let cancelled = false;
    loadCatalogue().then((catalogue) => {
      if (!cancelled) setMeta(catalogue[schemeId] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [schemeId]);

  return meta;
}
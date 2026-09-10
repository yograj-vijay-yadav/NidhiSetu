"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Landmark, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { ErrorBanner } from "../../components/ui";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const { loginDemo, loginDemoAdmin, user } = useAuth();

  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "demo" | "admin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" && returnTo === "/dashboard" ? "/dashboard" : returnTo);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .googleStatus()
        .then((status) => {
          setGoogleConfigured(status.configured);
          setAuthorizeUrl(status.authorize_url);
        })
        .catch(() => setGoogleConfigured(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, router, returnTo]);

  const handleDemo = async () => {
    setLoading("demo");
    setError(null);
    try {
      await loginDemo();
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
    } finally {
      setLoading(null);
    }
  };

  const handleDemoAdmin = async () => {
    setLoading("admin");
    setError(null);
    try {
      await loginDemoAdmin();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo admin login failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="nidhi-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid place-items-center h-11 w-11 rounded-full bg-navy text-white">
            <Landmark className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Sign in to NidhiSetu</h1>
            <p className="text-sm text-slate-500">Save analyses and track applications</p>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="space-y-3">
          {googleConfigured && authorizeUrl ? (
            <a href={authorizeUrl} className="nidhi-btn nidhi-btn-primary w-full">
              Continue with Google
            </a>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Google OAuth is not configured (no <code>GOOGLE_CLIENT_ID</code>). Use the demo
              login below.
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            demo mode
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleDemo}
            disabled={loading !== null}
            className="nidhi-btn nidhi-btn-outline w-full"
          >
            {loading === "demo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
            Continue as Demo Beneficiary
          </button>

          <button
            onClick={handleDemoAdmin}
            disabled={loading !== null}
            className="nidhi-btn nidhi-btn-outline w-full"
          >
            {loading === "admin" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Continue as Demo Admin (analytics)
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400 leading-relaxed">
          Demo identities are created locally in the platform&apos;s demo persistence layer.
          They are clearly labelled and never masquerade as real authentication.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
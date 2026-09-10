"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { Spinner } from "../../../components/ui";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=missing-token");
      return;
    }
    // JWT payload carries name/email/role; decode the payload locally.
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      login(token, {
        id: payload.sub,
        name: payload.name || "Beneficiary",
        email: payload.email || "",
        role: payload.role === "admin" ? "admin" : "user",
      });
      router.replace("/dashboard");
    } catch {
      router.replace("/login?error=bad-token");
    }
  }, [searchParams, router, login]);

  return <Spinner label="Completing sign-in…" />;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
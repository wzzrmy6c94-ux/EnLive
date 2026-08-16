"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EqualizerBackground } from "@/components/equalizer-background";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPanel />
    </Suspense>
  );
}

function VerifyEmailPanel() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying email...");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing.");
      return;
    }

    let cancelled = false;
    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          error?: string;
          username?: string;
        };
        if (!res.ok) throw new Error(data.error || "Verification failed.");
        if (cancelled) return;
        setUsername(data.username ?? null);
        setStatus("success");
        setMessage("Email verified.");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      className="enlive-auth min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        position: "relative",
        background:
          "radial-gradient(circle at top, var(--hero-glow), transparent 28%), linear-gradient(180deg, var(--shell-from), var(--shell-mid) 48%, var(--shell-to))",
      }}
    >
      <EqualizerBackground />
      <main
        className="enlive-auth-panel w-full max-w-sm border p-6 text-center sm:p-8"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
        }}
      >
        <p className="enlive-eyebrow">EnLive account</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[var(--text-strong)]">
          {status === "loading" ? "Verifying" : status === "success" ? "Verified" : "Verification failed"}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p>
        {username ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Username: <span className="font-semibold text-[var(--foreground)]">{username}</span>
          </p>
        ) : null}
        <Link
          href="/users/auth/login?verified=1"
          className="mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
          style={{
            background: "var(--primary)",
            color: "var(--button-text)",
            pointerEvents: status === "loading" ? "none" : "auto",
            opacity: status === "loading" ? 0.5 : 1,
          }}
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { EqualizerBackground } from "@/components/equalizer-background";

export default function UserLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        position: "relative",
        background:
          "radial-gradient(circle at top, var(--hero-glow), transparent 28%), linear-gradient(180deg, var(--shell-from), var(--shell-mid) 48%, var(--shell-to))",
      }}
    >
      <EqualizerBackground />
      <div
        className="w-full max-w-sm rounded-3xl border p-8 shadow-[0_30px_90px_var(--shadow)] backdrop-blur"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
        }}
      >
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Sign in
        </h1>

        {registered && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border)",
              background:
                "color-mix(in srgb, var(--primary) 12%, var(--surface))",
              color: "var(--foreground)",
            }}
          >
            Account created — sign in below.
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            void fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            })
              .then(async (res) => {
                const data = (await res.json()) as {
                  error?: string;
                  user?: { role: string };
                };
                if (!res.ok || !data.user)
                  throw new Error(data.error || "Login failed.");
                if (data.user.role === "admin") {
                  router.push("/admin/dashboard");
                } else {
                  router.push("/users/dashboard");
                }
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Login failed.");
              })
              .finally(() => setSubmitting(false));
          }}
        >
          <label className="block text-sm" htmlFor="email">
            <div className="mb-1.5 text-[var(--text-muted)]">Email</div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>
          <label className="block text-sm" htmlFor="password">
            <div className="mb-1.5 text-[var(--text-muted)]">Password</div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>

          {error && <p className="text-sm text-[var(--primary)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--button-text)",
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          No account?{" "}
          <Link
            href="/users/register"
            className="text-[var(--primary)] hover:opacity-80"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

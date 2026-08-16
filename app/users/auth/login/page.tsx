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
  const verified = params.get("verified") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailRequired, setEmailRequired] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <div
        className="enlive-auth-panel w-full max-w-sm border p-6 sm:p-8"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
        }}
      >
        <p className="enlive-eyebrow">EnLive account</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[var(--text-strong)]">Sign in</h1>
        <p className="mb-6 mt-2 text-sm text-[var(--text-secondary)]">Access your EnLive artist or venue profile.</p>

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
            Account created. Verify your email, then sign in below.
          </div>
        )}

        {verified && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border)",
              background:
                "color-mix(in srgb, var(--primary) 12%, var(--surface))",
              color: "var(--foreground)",
            }}
          >
            Email verified. Sign in with your username.
          </div>
        )}

        {verificationUrl ? (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border)",
              background:
                "color-mix(in srgb, var(--primary) 12%, var(--surface))",
              color: "var(--foreground)",
            }}
          >
            <p className="font-semibold">Verification email ready.</p>
            <p className="mt-1 text-[var(--text-muted)]">
              MVP mode: use this link to verify the account.
            </p>
            <Link
              href={verificationUrl}
              className="mt-3 inline-flex rounded-xl px-4 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--button-text)" }}
            >
              Verify email
            </Link>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            void fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username,
                password,
                email: emailRequired ? verificationEmail : undefined,
              }),
            })
              .then(async (res) => {
                const data = (await res.json()) as {
                  error?: string;
                  user?: { role: string };
                  emailRequired?: boolean;
                  verificationUrl?: string;
                };
                if (data.verificationUrl) {
                  setVerificationUrl(data.verificationUrl);
                  setEmailRequired(false);
                  return;
                }
                if (!res.ok) {
                  if (data.emailRequired) {
                    setEmailRequired(true);
                    setError(null);
                    return;
                  }
                  throw new Error(data.error || "Login failed.");
                }
                if (!data.user) throw new Error(data.error || "Login failed.");
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
          <label className="block text-sm" htmlFor="username">
            <div className="mb-1.5 text-[var(--text-muted)]">Username</div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>
          {emailRequired ? (
            <label className="block text-sm" htmlFor="verification-email">
              <div className="mb-1.5 text-[var(--text-muted)]">Email for verification</div>
              <input
                id="verification-email"
                type="email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-elevated)",
                  color: "var(--foreground)",
                }}
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                This email will be used for account verification and recovery.
              </p>
            </label>
          ) : null}
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

          {error && <p role="alert" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--button-text)",
            }}
          >
            {submitting ? "Working…" : emailRequired ? "Send verification link" : "Sign in"}
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

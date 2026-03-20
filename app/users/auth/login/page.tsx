"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function UserLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const COL_COUNT = 40;
const DOT_COUNT = 44; // 44 × 9px = 396px — enough for any screen height

function EqualizerBackground() {
  return (
    <>
      <style>{`
        @keyframes eq1 {
          0%,100% { transform: scaleY(0.12) }
          25%      { transform: scaleY(0.58) }
          50%      { transform: scaleY(0.28) }
          75%      { transform: scaleY(0.72) }
        }
        @keyframes eq2 {
          0%,100% { transform: scaleY(0.48) }
          30%      { transform: scaleY(0.14) }
          60%      { transform: scaleY(0.76) }
          80%      { transform: scaleY(0.34) }
        }
        @keyframes eq3 {
          0%,100% { transform: scaleY(0.62) }
          20%      { transform: scaleY(0.20) }
          50%      { transform: scaleY(0.78) }
          70%      { transform: scaleY(0.40) }
        }
        @keyframes eq4 {
          0%,100% { transform: scaleY(0.32) }
          35%      { transform: scaleY(0.68) }
          65%      { transform: scaleY(0.16) }
          85%      { transform: scaleY(0.54) }
        }
        @keyframes eq5 {
          0%,100% { transform: scaleY(0.52) }
          15%      { transform: scaleY(0.80) }
          45%      { transform: scaleY(0.20) }
          75%      { transform: scaleY(0.64) }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.28,
          maskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
        }}
      >
        {Array.from({ length: COL_COUNT }).map((_, i) => {
          const variant = (i % 5) + 1;
          const duration = 1.6 + (i % 7) * 0.28;
          const delay = -((i * 0.19) % 2.4);
          return (
            <div
              key={i}
              style={{
                flex: "1 1 0",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "center",
                  gap: "4px",
                  paddingBottom: "8px",
                  transformOrigin: "bottom center",
                  animationName: `eq${variant}`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                }}
              >
                {Array.from({ length: DOT_COUNT }).map((_, d) => (
                  <div
                    key={d}
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EqualizerBackground } from "@/components/equalizer-background";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function readResponseError(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { error?: string };
      return data.error || "Login failed.";
    }

    const text = (await res.text()).trim();
    return text || "Login failed.";
  }

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
        <p className="enlive-eyebrow">EnLive administration</p>
        <h1 className="mb-6 mt-3 text-3xl font-black tracking-[-0.05em] text-[var(--text-strong)]">Sign in</h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            void fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
            })
              .then(async (res) => {
                const contentType = res.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) {
                  throw new Error(await readResponseError(res));
                }

                const data = (await res.json()) as {
                  error?: string;
                  user?: { role: string };
                };
                if (!res.ok || !data.user) {
                  throw new Error(data.error || "Login failed.");
                }
                router.push(
                  data.user.role === "admin" ? "/admin/dashboard" : "/dashboard",
                );
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Login failed.");
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          <label className="block text-sm">
            <div className="mb-2 text-[var(--text-muted)]">Username</div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>
          <label className="block text-sm">
            <div className="mb-2 text-[var(--text-muted)]">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>
          {error ? (
            <p role="alert" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--button-text)" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

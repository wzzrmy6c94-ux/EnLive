"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { initialDb, readDb, type Db } from "@/lib/enlive-store";

const demos = [
  { email: "crown@enlive.local", password: "demo123", label: "Venue" },
  { email: "neon@enlive.local", password: "demo123", label: "Artist" },
  { email: "admin@enlive.local", password: "admin123", label: "Admin" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [db, setDb] = useState<Db>(initialDb);
  const [email, setEmail] = useState("crown@enlive.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDb(readDb());
  }, []);

  return (
    <EnliveShell 
      title="Venue / Artist Login" 
      subtitle="Demo auth for dashboard and admin access."
      headerMode="public"
    >
      <main className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
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
                  if (!res.ok || !data.user) {
                    throw new Error(data.error || "Login failed.");
                  }
                  router.push(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
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
              <div className="mb-2 text-[var(--text-muted)]">Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
              />
            </label>
            <label className="block text-sm">
              <div className="mb-2 text-[var(--text-muted)]">Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
              />
            </label>
            {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{ background: "var(--primary)", color: "var(--button-text)" }}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </Panel>

        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">One-click demo accounts</h2>
          <div className="mt-3 grid gap-2">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => {
                  setEmail(demo.email);
                  setPassword(demo.password);
                }}
                className="rounded-xl border px-3 py-3 text-left text-sm transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}
              >
                <div className="font-medium text-[var(--foreground)]">{demo.label}</div>
                <div className="text-[var(--text-muted)]">{demo.email}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border p-3 text-sm text-[var(--text-muted)]" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
            Demo users currently in store: {db.users.length}. New venue/artist accounts can be created in the admin page.
          </div>
          <Link href="/" className="mt-3 inline-flex text-sm text-[var(--primary)] hover:opacity-80">
            Back to leaderboard
          </Link>
        </Panel>
      </main>
    </EnliveShell>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { CATEGORY_LABELS, SCORE_SCALE } from "@/lib/enlive-store";

type Target = {
  id: string;
  name: string;
  role: "venue" | "artist";
  location: string;
};

export default function RatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<{ c1: number; c2: number; c3: number; c4: string }>({ c1: 4, c2: 4, c3: 4, c4: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/targets/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { target?: Target; error?: string };
        if (!res.ok || !data.target) throw new Error(data.error || "Target not found.");
        if (!cancelled) setTarget(data.target);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Target not found.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <EnliveShell title="Rating Link" subtitle="Public QR submission form" headerMode="public">
        <Panel><p className="text-sm text-[var(--text-muted)]">Loading target…</p></Panel>
      </EnliveShell>
    );
  }

  if (!target) {
    return (
      <EnliveShell title="Rating Link" subtitle="Public QR submission form" headerMode="public">
        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
          <p className="text-sm text-[var(--text-muted)]">{error || "Target not found."}</p>
          <Link href="/" className="mt-3 inline-flex text-sm text-[var(--primary)] hover:opacity-80">Back to leaderboard</Link>
        </Panel>
      </EnliveShell>
    );
  }

  return (
    <EnliveShell
      title={`Rate ${target.name}`}
      subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Public QR submission form`}
      headerMode="public"
    >
      <main className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setMessage(null);
              const body = {
                targetId: target.id,
                category1: values.c1,
                category2: values.c2,
                category3: values.c3,
                category4: values.c4 === "" ? undefined : Number(values.c4),
              };
              void fetch("/api/ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
                .then(async (res) => {
                  const data = (await res.json()) as { error?: string; rating?: { overallScore: number } };
                  if (!res.ok || !data.rating) throw new Error(data.error || "Failed to submit rating.");
                  setMessage(`Thanks. Your rating was recorded with overall score ${data.rating.overallScore.toFixed(2)}/100.`);
                  window.setTimeout(() => router.push("/"), 900);
                })
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "Failed to submit rating.");
                });
            }}
          >
            {[1, 2, 3, 4].map((idx) => (
              <label key={idx} className="block rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                <div className="mb-2 text-sm font-medium text-[var(--foreground)]">{CATEGORY_LABELS[idx - 1]}</div>
                <select
                  value={idx === 4 ? values.c4 : values[`c${idx}` as "c1" | "c2" | "c3"]}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (idx === 4) return setValues((prev) => ({ ...prev, c4: value }));
                    setValues((prev) => ({ ...prev, [`c${idx}`]: Number(value) } as typeof prev));
                  }}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                >
                  {idx === 4 ? <option value="">Skip this category</option> : null}
                  {Array.from({ length: SCORE_SCALE.max - SCORE_SCALE.min + 1 }, (_, i) => SCORE_SCALE.min + i).map((score) => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </label>
            ))}

            {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}
            {message ? <p className="text-sm text-[var(--primary)]">{message}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: "var(--primary)", color: "var(--button-text)" }}>
                Submit rating
              </button>
              <Link href="/" className="text-sm text-[var(--text-muted)] hover:opacity-80">Cancel</Link>
            </div>
          </form>
        </Panel>

        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Notes</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <li>Scores use simple mean averaging.</li>
            <li>Category 4 is optional and excluded when omitted.</li>
            <li>Duplicate rapid submissions are blocked on the server.</li>
            <li>Submissions update the server-backed leaderboard data.</li>
          </ul>
        </Panel>
      </main>
    </EnliveShell>
  );
}

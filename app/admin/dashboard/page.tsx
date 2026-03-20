"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel } from "@/components/enlive-shell";

type TargetType = "venue" | "artist";

type AdminUserRow = {
  id: string;
  name: string;
  role: TargetType;
  location: string;
  createdAt: string;
  averageScore: number;
  ratingCount: number;
};

type AdminRatingRow = {
  id: string;
  targetId: string;
  targetType: TargetType;
  overallScore: number;
  location: string;
  createdAt: string;
  targetName: string | null;
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [ratings, setRatings] = useState<AdminRatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { users?: AdminUserRow[]; ratings?: AdminRatingRow[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load admin overview");
        setUsers(data.users ?? []);
        setRatings(data.ratings ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load admin overview"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="xl:col-span-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Server-backed admin operations for venues, artists, and ratings.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:col-span-2">
        <div className="grid gap-4">
          <Panel className="shadow-[0_18px_60px_var(--shadow)]">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Add user</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Create a new venue or artist with a shareable EnLive Unique ID in the format
              <span className="font-medium text-[var(--foreground)]"> A123456 </span>
              or
              <span className="font-medium text-[var(--foreground)]"> V123456</span>, plus type-specific settings.
            </p>
            <Link
              href="/admin/users/add"
              className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--button-text)" }}
            >
              Open add user form
            </Link>
          </Panel>

          <Panel>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Test data controls</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => adminAction("clearRatings", setError, setNotice, load)} className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-200 hover:border-amber-300/70">Delete test ratings</button>
              <button type="button" onClick={() => adminAction("resetDatabase", setError, setNotice, load)} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--border-strong)", background: "var(--surface-muted)", color: "var(--primary)" }}>Full reset</button>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel className="shadow-[0_18px_60px_var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--foreground)]">All venues & artists</h2>
              <button type="button" onClick={load} className="rounded-xl border px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Refresh</button>
            </div>
            {loading ? <p className="mt-3 text-sm text-[var(--text-muted)]">Loading…</p> : null}
            <div className="mt-3 overflow-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--text-muted)]" style={{ background: "var(--surface)" }}><tr><th className="px-3 py-2 font-medium">Name</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Town</th><th className="px-3 py-2 font-medium">Avg</th><th className="px-3 py-2 font-medium">Ratings</th></tr></thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2 text-[var(--foreground)]">{row.name}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.role}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.location}</td>
                      <td className="px-3 py-2 text-[var(--primary)]">{row.averageScore.toFixed(2)}/100</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.ratingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Recent ratings (all)</h2>
            <div className="mt-3 space-y-2">
              {ratings.length ? ratings.map((rating) => (
                <div key={rating.id} className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-[var(--foreground)]">{rating.targetName ?? rating.targetId}</div>
                    <div className="text-xs text-[var(--text-muted)]">{new Date(rating.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-[var(--text-muted)]">{rating.targetType} • {rating.location} • overall {rating.overallScore.toFixed(2)}/100</div>
                </div>
              )) : <p className="text-sm text-[var(--text-muted)]">No ratings recorded.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function adminAction(
  action: "clearRatings" | "resetDatabase",
  setError: (v: string | null) => void,
  setNotice: (v: string | null) => void,
  reload: () => void,
) {
  setError(null);
  setNotice(null);
  void fetch("/api/admin/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Action failed");
      setNotice(action === "clearRatings" ? "All ratings cleared." : "Demo database reset to seeded users and ratings.");
      reload();
    })
    .catch((err: unknown) => setError(err instanceof Error ? err.message : "Action failed"));
}

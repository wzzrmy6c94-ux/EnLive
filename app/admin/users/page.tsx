"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel } from "@/components/enlive-shell";

type AdminUserRow = {
  id: string;
  enliveUid: string;
  name: string;
  role: "venue" | "artist" | "city";
  location: string;
  createdAt: string;
  averageScore: number;
  ratingCount: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { users?: AdminUserRow[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load users");
        setUsers(data.users ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="grid gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Venues and artists currently registered in the system.
          </p>
        </div>
        <Link
          href="/admin/users/add"
          className="rounded-full border px-4 py-2 text-sm font-medium transition hover:opacity-90"
          style={{ borderColor: "var(--border)", background: "var(--primary)", color: "var(--button-text)" }}
        >
          Add user
        </Link>
      </section>

      <Panel className="shadow-[0_18px_60px_var(--shadow)]">
        {loading ? <p className="text-sm text-[var(--text-muted)]">Loading…</p> : null}
        {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--text-muted)]" style={{ background: "var(--surface)" }}>
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">EnLive ID</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Town</th>
                  <th className="px-3 py-2 font-medium">Avg</th>
                  <th className="px-3 py-2 font-medium">Ratings</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 text-[var(--foreground)]">{row.name}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{row.enliveUid}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{row.role}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{row.location}</td>
                    <td className="px-3 py-2 text-[var(--primary)]">{row.averageScore.toFixed(2)}/100</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{row.ratingCount}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>
    </main>
  );
}

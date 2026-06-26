"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminQrModal } from "@/components/admin-qr-modal";
import { Panel } from "@/components/enlive-shell";

type AdminUserRow = {
  id: string;
  enliveUid: string;
  username: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  role: "venue" | "artist" | "city";
  location: string;
  genre: string | null;
  country: string | null;
  squareSubscriptionId: string | null;
  moderation: {
    status: "active" | "flagged" | "disabled";
    reason: string | null;
    updatedAt: string | null;
  };
  createdAt: string;
  averageScore: number;
  ratingCount: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<AdminUserRow | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = (await res.json()) as { users?: AdminUserRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function activateRatingForm(row: AdminUserRow) {
    setBusyAction(`activate:${row.id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activateRatingForm", userId: row.id }),
      });
      const data = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) throw new Error(data.error || "Failed to activate rating form");
      setNotice(`${data.name ?? row.name} rating form activated.`);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to activate rating form");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="grid gap-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Click a profile to inspect admin-only account details.
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
        {notice ? <p className="mb-3 text-sm font-medium text-emerald-300">{notice}</p> : null}
        {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--text-muted)]" style={{ background: "var(--surface)" }}>
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">EnLive ID</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Town</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Avg</th>
                  <th className="px-3 py-2 font-medium">Ratings</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const expanded = expandedId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr
                        className="cursor-pointer border-t transition hover:bg-[var(--surface)]"
                        style={{ borderColor: "var(--border)" }}
                        onClick={() => setExpandedId(expanded ? null : row.id)}
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-left font-medium text-[var(--foreground)] transition hover:text-[var(--primary)]"
                            aria-expanded={expanded}
                            aria-controls={`admin-user-${row.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedId(expanded ? null : row.id);
                            }}
                          >
                            <span className="mr-2 inline-block w-4 text-[var(--text-muted)]">
                              {expanded ? "−" : "+"}
                            </span>
                            {row.name}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-[var(--text-muted)]">{row.username}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{row.enliveUid}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{row.role}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{row.location || "—"}</td>
                        <td className="px-3 py-2"><ModerationBadge status={row.moderation.status} /></td>
                        <td className="px-3 py-2 text-[var(--primary)]">{row.averageScore.toFixed(2)}/100</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{row.ratingCount}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{new Date(row.createdAt).toLocaleDateString()}</td>
                      </tr>
                      {expanded ? (
                        <tr id={`admin-user-${row.id}`} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td colSpan={9} className="px-3 py-4">
                            <div
                              className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1.2fr_1fr]"
                              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                            >
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Detail label="Username" value={row.username} mono />
                                <Detail label="Email" value={row.email ?? "Not set"} mono />
                                <Detail label="Email status" value={row.emailVerified ? "Verified" : "Needs verification"} />
                                <Detail label="Internal ID" value={row.id} mono />
                                <Detail label="EnLive ID" value={row.enliveUid} mono />
                                <Detail label="Role" value={row.role} />
                                <Detail label="Town / City" value={row.location || "—"} />
                                <Detail label="Moderation" value={formatModeration(row.moderation.status)} />
                                <Detail label="Moderation reason" value={row.moderation.reason ?? "—"} />
                                <Detail label="Genre" value={row.genre ?? "—"} />
                                <Detail label="Country" value={row.country ?? "—"} />
                                <Detail
                                  label="Subscription"
                                  value={row.squareSubscriptionId ? `Active (${row.squareSubscriptionId})` : "No subscription ID"}
                                  mono={Boolean(row.squareSubscriptionId)}
                                />
                              </div>
                              <div className="flex flex-col justify-between gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                                <div>
                                  <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Admin shortcuts</div>
                                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                                    Open the public profile or print this account's rating QR code.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                    href={`/target/${row.id}`}
                                    className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                  >
                                    Public profile
                                  </Link>
                                  {row.role !== "city" ? (
                                    <button
                                      type="button"
                                      onClick={() => setQrTarget(row)}
                                      className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    >
                                      Print QR
                                    </button>
                                  ) : null}
                                  {!row.emailVerified ? (
                                    <ConfirmActionButton
                                      label="Activate form"
                                      confirmLabel="Are you sure?"
                                      disabled={busyAction === `activate:${row.id}`}
                                      onConfirm={() => void activateRatingForm(row)}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>
      <AdminQrModal target={qrTarget} onClose={() => setQrTarget(null)} />
    </main>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 break-words text-sm text-[var(--foreground)] ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function formatModeration(status: AdminUserRow["moderation"]["status"]) {
  if (status === "disabled") return "Disabled";
  if (status === "flagged") return "Flagged";
  return "Active";
}

function ModerationBadge({ status }: { status: AdminUserRow["moderation"]["status"] }) {
  const className = status === "disabled"
    ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
    : status === "flagged"
      ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200"
      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {formatModeration(status)}
    </span>
  );
}

function ConfirmActionButton({
  label,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  useEffect(() => {
    if (disabled) setArmed(false);
  }, [disabled]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
          return;
        }
        setArmed(true);
      }}
      className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        borderColor: armed ? "rgb(252 211 77 / 0.75)" : "rgb(252 211 77 / 0.35)",
        background: armed ? "rgb(252 211 77 / 0.18)" : "rgb(252 211 77 / 0.08)",
        color: "rgb(253 230 138)",
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

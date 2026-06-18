"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/enlive-shell";
import { PlanManager } from '@/components/PlanManager';


type TargetType = "venue" | "artist" | "city";
type ProfileModerationStatus = "active" | "flagged" | "disabled";

type ProfileModeration = {
  status: ProfileModerationStatus;
  reason: string | null;
  updatedAt: string | null;
};

type AdminUserRow = {
  id: string;
  name: string;
  role: TargetType;
  location: string;
  moderation: ProfileModeration;
  createdAt: string;
  averageScore: number;
  ratingCount: number;
};

type AdminRatingRow = {
  id: string;
  targetId: string;
  targetType: TargetType;
  category1: number;
  category2: number;
  category3: number;
  category4: number | null;
  overallScore: number;
  location: string;
  deviceId: string;
  createdAt: string;
  targetName: string | null;
  sameDeviceTargetCount: number;
  sameDeviceTotalCount: number;
};

type AdminDeleteResponse = {
  ok?: boolean;
  error?: string;
  targetId?: string;
  targetName?: string;
  deletedCount?: number;
};

type AdminModerationResponse = {
  ok?: boolean;
  error?: string;
  name?: string;
  moderation?: ProfileModeration;
};

const CATEGORY_LABELS: Record<TargetType, [string, string, string, string]> = {
  venue: [
    "Sound & Technical Experience",
    "Atmosphere & Ambience",
    "Staff & Operations",
    "Amenities & Value",
  ],
  artist: [
    "Performance Quality",
    "Stage Presence & Engagement",
    "Set & Musical Experience",
    "Fan Experience",
  ],
  city: ["Category 1", "Category 2", "Category 3", "Category 4"],
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [ratings, setRatings] = useState<AdminRatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<AdminUserRow | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = (await res.json()) as { users?: AdminUserRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load admin overview");
      const nextUsers = data.users ?? [];
      setUsers(nextUsers);
      setSelectedTarget((current) => {
        if (!current) return current;
        return nextUsers.find((user) => user.id === current.id) ?? current;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin overview");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRatings = useCallback(async (targetId?: string | null, deviceId?: string | null) => {
    setRatingsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "75" });
      if (targetId) params.set("targetId", targetId);
      if (deviceId) params.set("deviceId", deviceId);
      const res = await fetch(`/api/admin/ratings?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as { ratings?: AdminRatingRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load ratings");
      setRatings(data.ratings ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load ratings");
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setError(null);
    void loadOverview();
    void loadRatings(selectedTarget?.id ?? null, deviceFilter);
  }, [deviceFilter, loadOverview, loadRatings, selectedTarget?.id]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadRatings(selectedTarget?.id ?? null, deviceFilter);
  }, [deviceFilter, loadRatings, selectedTarget?.id]);

  async function deleteRating(rating: AdminRatingRow) {
    setBusyAction(`rating:${rating.id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/ratings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteRating", ratingId: rating.id }),
      });
      const data = (await res.json()) as AdminDeleteResponse;
      if (!res.ok) throw new Error(data.error || "Failed to delete rating");
      setNotice("Rating deleted and profile score recalculated.");
      await Promise.all([loadOverview(), loadRatings(selectedTarget?.id ?? null, deviceFilter)]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete rating");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteTargetHistory(target: AdminUserRow) {
    setBusyAction(`target:${target.id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/ratings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteTargetHistory", targetId: target.id }),
      });
      const data = (await res.json()) as AdminDeleteResponse;
      if (!res.ok) throw new Error(data.error || "Failed to delete rating history");
      setNotice(`${data.deletedCount ?? 0} ratings deleted for ${data.targetName ?? target.name}.`);
      await Promise.all([loadOverview(), loadRatings(selectedTarget?.id ?? null, deviceFilter)]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete rating history");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateProfileModeration(target: AdminUserRow, status: ProfileModerationStatus) {
    const reason = status === "active"
      ? undefined
      : window.prompt(status === "disabled" ? "Reason for disabling this profile?" : "Reason for flagging this profile?", target.moderation.reason ?? "");
    if (reason === null) return;

    setBusyAction(`moderation:${target.id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setModerationStatus", userId: target.id, status, reason }),
      });
      const data = (await res.json()) as AdminModerationResponse;
      if (!res.ok) throw new Error(data.error || "Failed to update profile status");
      const statusLabel = status === "active" ? "active" : status;
      setNotice(`${data.name ?? target.name} marked ${statusLabel}.`);
      await Promise.all([loadOverview(), loadRatings(selectedTarget?.id ?? null, deviceFilter)]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile status");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="xl:col-span-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Server-backed admin operations for venues, artists, and ratings.
        </p>
        {notice ? <p className="mt-3 text-sm font-medium text-emerald-300">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm font-medium text-[var(--primary)]">{error}</p> : null}
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
            <h2 className="text-base font-semibold text-[var(--foreground)]">Subscription Plans</h2>
            <PlanManager />
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel className="shadow-[0_18px_60px_var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--foreground)]">All venues & artists</h2>
              <button type="button" onClick={refresh} className="rounded-xl border px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Refresh</button>
            </div>
            {loading ? <p className="mt-3 text-sm text-[var(--text-muted)]">Loading...</p> : null}
            <div className="mt-3 overflow-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--text-muted)]" style={{ background: "var(--surface)" }}><tr><th className="px-3 py-2 font-medium">Name</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Town</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Avg</th><th className="px-3 py-2 font-medium">Ratings</th><th className="px-3 py-2 font-medium">Actions</th></tr></thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id} className={`border-t ${selectedTarget?.id === row.id ? "bg-[var(--surface)]" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2 text-[var(--foreground)]">{row.name}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.role}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.location}</td>
                      <td className="px-3 py-2"><ModerationBadge moderation={row.moderation} /></td>
                      <td className="px-3 py-2 text-[var(--primary)]">{row.averageScore.toFixed(2)}/100</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.ratingCount}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTarget(row);
                              setDeviceFilter(null);
                            }}
                            className="rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                          >
                            View ratings
                          </button>
                          {row.moderation.status !== "flagged" ? (
                            <button
                              type="button"
                              disabled={busyAction === `moderation:${row.id}`}
                              onClick={() => void updateProfileModeration(row, "flagged")}
                              className="rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
                              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                            >
                              Flag
                            </button>
                          ) : null}
                          {row.moderation.status !== "disabled" ? (
                            <ConfirmActionButton
                              label="Disable"
                              confirmLabel="Are you sure?"
                              disabled={busyAction === `moderation:${row.id}`}
                              onConfirm={() => void updateProfileModeration(row, "disabled")}
                              compact
                            />
                          ) : (
                            <button
                              type="button"
                              disabled={busyAction === `moderation:${row.id}`}
                              onClick={() => void updateProfileModeration(row, "active")}
                              className="rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
                              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                            >
                              Enable
                            </button>
                          )}
                          <ConfirmActionButton
                            label="Delete history"
                            confirmLabel="Are you sure?"
                            disabled={busyAction === `target:${row.id}` || row.ratingCount === 0}
                            onConfirm={() => void deleteTargetHistory(row)}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">Rating moderation</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {selectedTarget ? (
                    <FilterPill label="Profile" value={selectedTarget.name} onClear={() => setSelectedTarget(null)} />
                  ) : (
                    <span className="rounded-full border px-3 py-1 text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>All profiles</span>
                  )}
                  {deviceFilter ? (
                    <FilterPill label="Device" value={deviceFilter} onClear={() => setDeviceFilter(null)} mono />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTarget ? (
                  <ConfirmActionButton
                    label="Delete selected history"
                    confirmLabel="Are you sure?"
                    disabled={busyAction === `target:${selectedTarget.id}` || selectedTarget.ratingCount === 0}
                    onConfirm={() => void deleteTargetHistory(selectedTarget)}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  Refresh ratings
                </button>
              </div>
            </div>
            {ratingsLoading ? <p className="mt-3 text-sm text-[var(--text-muted)]">Loading ratings...</p> : null}
            <div className="mt-3 space-y-2">
              {ratings.length ? ratings.map((rating) => (
                <details key={rating.id} className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">{rating.targetName ?? rating.targetId}</div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">{rating.targetType} / {rating.location} / {formatScore(rating.overallScore)}</div>
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{formatDateTime(rating.createdAt)}</div>
                    </div>
                  </summary>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div className="grid gap-2">
                      {categoryDetails(rating).map((detail) => (
                        <DetailRow key={detail.label} label={detail.label} value={detail.value} />
                      ))}
                    </div>
                    <div className="grid gap-2">
                      <DetailRow label="Rating ID" value={rating.id} mono />
                      <DetailRow label="Target ID" value={rating.targetId} mono />
                      <DetailRow label="Device ID" value={rating.deviceId} mono />
                      <DetailRow label="Same device on this profile" value={String(rating.sameDeviceTargetCount)} />
                      <DetailRow label="Same device total ratings" value={String(rating.sameDeviceTotalCount)} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDeviceFilter(rating.deviceId)}
                      className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      Filter device
                    </button>
                    <Link
                      href={`/target/${rating.targetId}`}
                      className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      Public profile
                    </Link>
                    <ConfirmActionButton
                      label="Delete rating"
                      confirmLabel="Are you sure?"
                      disabled={busyAction === `rating:${rating.id}`}
                      onConfirm={() => void deleteRating(rating)}
                    />
                  </div>
                </details>
              )) : <p className="text-sm text-[var(--text-muted)]">No ratings found.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function ConfirmActionButton({
  label,
  confirmLabel,
  disabled,
  compact = false,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  disabled?: boolean;
  compact?: boolean;
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
      className={`${compact ? "rounded-lg px-2.5 py-1" : "rounded-xl px-3 py-2"} border text-xs font-semibold transition hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-45`}
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

function formatScore(value: number) {
  return `${value.toFixed(2)}/100`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ModerationBadge({ moderation }: { moderation: ProfileModeration }) {
  const label = moderation.status === "disabled"
    ? "Disabled"
    : moderation.status === "flagged"
      ? "Flagged"
      : "Active";
  const className = moderation.status === "disabled"
    ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
    : moderation.status === "flagged"
      ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200"
      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";

  return (
    <span title={moderation.reason ?? undefined} className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function categoryDetails(rating: AdminRatingRow) {
  const labels = CATEGORY_LABELS[rating.targetType];
  return [
    { label: labels[0], value: formatScore(rating.category1) },
    { label: labels[1], value: formatScore(rating.category2) },
    { label: labels[2], value: formatScore(rating.category3) },
    { label: labels[3], value: rating.category4 == null ? "Not stored" : formatScore(rating.category4) },
    { label: "Overall", value: formatScore(rating.overallScore) },
  ];
}

function FilterPill({
  label,
  value,
  mono,
  onClear,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`truncate text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>{value}</span>
      <button type="button" onClick={onClear} className="text-[var(--text-muted)] transition hover:text-[var(--foreground)]" aria-label={`Clear ${label.toLowerCase()} filter`}>
        x
      </button>
    </span>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 break-words text-sm text-[var(--foreground)] ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

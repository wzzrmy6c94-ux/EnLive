"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { LeaderboardTabs, type TabType } from "@/components/leaderboard-tabs";

type TargetType = TabType;

type LeaderboardRow = {
  id: string;
  name: string;
  location: string;
  genre: string | null;
  country: string | null;
  role: TargetType;
  averageScore: number;
  ratingCount: number;
};

type TargetDetails = {
  id: string;
  name: string;
  role: TargetType;
  location: string;
  stats: {
    totalRatings: number;
    averageScore: number;
    category1Average: number;
    category2Average: number;
    category3Average: number;
    category4Average: number | null;
  };
  recentRatings: Array<{
    id: string;
    overallScore: number;
    category1: number;
    category2: number;
    category3: number;
    category4: number | null;
    createdAt: string;
  }>;
};

const CATEGORY_LABELS: Record<TabType, string[]> = {
  venue: ["Atmosphere", "Sound Quality", "Staff", "Value"],
  artist: ["Performance", "Stage Presence", "Setlist", "Crowd Engagement"],
  city: [
    "Live Music Culture",
    "Venue Density",
    "Artist Support",
    "Audience Turnout",
  ],
};

// ─── Rate Modal ───────────────────────────────────────────────────────────────

function RateModal({
  targetId,
  targetName,
  onClose,
}: {
  targetId: string;
  targetName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Rate ${targetName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{
          background: "var(--surface-elevated)",
          borderColor: "var(--border-strong)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-strong)]">
            Rate <span className="text-[var(--primary)]">{targetName}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--text-muted)] transition hover:text-[var(--foreground)]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          You'll be taken to the rating page. Your progress on this leaderboard
          won't be lost.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/rate/${targetId}`}
            className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition hover:opacity-90"
            style={{
              background: "var(--primary)",
              color: "var(--button-text)",
            }}
          >
            Continue to Rating
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm transition hover:border-[var(--border-strong)]"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-muted)",
              color: "var(--text-muted)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

import { EqualizerBackground } from "@/components/equalizer-background";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TargetType>("venue");
  const [location, setLocation] = useState<string>("All");
  const [minRatings, setMinRatings] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [locations, setLocations] = useState<string[]>(["All"]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetDetails | null>(
    null,
  );
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "profile">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const handleLiveRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Fetch leaderboard rows ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingRows(true);
    setRowsError(null);

    const params = new URLSearchParams({
      type: activeTab,
      minRatings: String(minRatings),
    });
    if (location !== "All") params.set("location", location);

    fetch(`/api/leaderboard?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          rows?: LeaderboardRow[];
          locations?: string[];
          error?: string;
        };
        if (!res.ok)
          throw new Error(data.error || "Failed to load leaderboard");
        if (cancelled) return;
        setRows(data.rows ?? []);
        setLocations(["All", ...(data.locations ?? [])]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows([]);
        setRowsError(
          err instanceof Error ? err.message : "Failed to load leaderboard",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingRows(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, location, minRatings, refreshKey]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [rows, searchQuery]);

  useEffect(() => {
    if (rows.length && selectedId === null) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, location, minRatings, searchQuery]);

  // ── Fetch target details ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRow) {
      setSelectedTarget(null);
      return;
    }
    let cancelled = false;
    setLoadingTarget(true);

    fetch(`/api/targets/${selectedRow.id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          target?: TargetDetails;
          error?: string;
        };
        if (!res.ok || !data.target)
          throw new Error(data.error || "Failed to load target");
        if (!cancelled) setSelectedTarget(data.target);
      })
      .catch(() => {
        if (!cancelled) setSelectedTarget(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTarget(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRow?.id]);

  const catLabels = CATEGORY_LABELS[activeTab];

  // Rank row styles — gold/silver/bronze are intentionally hardcoded;
  // they are real-world medal colors, not theme colors, and should not invert.
  const rankRowStyle = (rank: number, i: number): React.CSSProperties => {
    if (rank === 1) return { background: "rgba(255, 215, 0, 0.10)" };
    if (rank === 2) return { background: "rgba(192, 192, 192, 0.08)" };
    if (rank === 3) return { background: "rgba(205, 127, 50, 0.08)" };
    return {
      background: i % 2 === 0 ? "var(--surface)" : "var(--surface-muted)",
    };
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulseRow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1.5px var(--primary);
          }
          50% {
            box-shadow: inset 0 0 0 1.5px var(--primary-light);
          }
        }
        .rank-first {
          animation: pulseRow 2s infinite ease-in-out;
        }
      `}</style>

      {showRateModal && selectedRow && (
        <RateModal
          targetId={selectedRow.id}
          targetName={selectedRow.name}
          onClose={() => setShowRateModal(false)}
        />
      )}

      <div style={{ position: "relative" }}>
        <EqualizerBackground />
        <EnliveShell
          title="Live Music Leaderboards"
          subtitle="Public leaderboard experience. Dashboard is for signed-in venues and artists only."
          headerMode="public"
          hideHeroHeader
        >
          <main className="grid gap-6">
            {/* ── Tabs + filters ───────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-lg">
                <LeaderboardTabs
                  activeTab={activeTab}
                  showFilters={showFilters}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setSelectedId(null);
                    setViewMode("list");
                  }}
                />
              </div>

              {viewMode === "list" && showFilters && (
                <div
                  className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border p-4 transition-all animate-in fade-in slide-in-from-top-2"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <input
                        type="text"
                        placeholder={`Search ${activeTab === "artist" ? "artists" : activeTab === "venue" ? "venues" : "cities"}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--surface-elevated)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>

                    {/* Location filter */}
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="town-select"
                        className="text-xs uppercase tracking-[0.12em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Town:
                      </label>
                      <select
                        id="town-select"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none cursor-pointer"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--surface-elevated)",
                          color: "var(--foreground)",
                        }}
                      >
                        {locations.map((town) => (
                          <option key={town} value={town}>
                            {town}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Min ratings toggle */}
                    <label
                      className="flex cursor-pointer items-center gap-2 text-xs select-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <input
                        type="checkbox"
                        className="accent-[var(--primary)]"
                        checked={minRatings === 3}
                        onChange={(e) =>
                          setMinRatings(e.target.checked ? 3 : 1)
                        }
                      />
                      Require 3+ ratings
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ── List view ────────────────────────────────────────────── */}
            {viewMode === "list" ? (
              <Panel className="mx-auto w-full max-w-4xl overflow-hidden p-0 shadow-[0_30px_90px_var(--shadow)]">
                <div className="overflow-x-auto">
                  {(() => {
                    const totalCols = activeTab === "artist" ? 7 : 6;
                    return (
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <th
                              className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Rank
                            </th>
                            <th
                              className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            ></th>
                            <th
                              className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Name
                            </th>
                            {activeTab === "artist" && (
                              <th
                                className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Genre
                              </th>
                            )}
                            <th
                              className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {activeTab === "city" ? "Country" : "City"}
                            </th>
                            <th
                              className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              # Ratings
                            </th>
                            <th
                              className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingRows ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-20 text-center text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Loading leaderboard…
                              </td>
                            </tr>
                          ) : rowsError ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-20 text-center text-sm"
                                style={{ color: "var(--danger)" }}
                              >
                                {rowsError}
                              </td>
                            </tr>
                          ) : filteredRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-20 text-center text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {searchQuery
                                  ? "No matches found for your search."
                                  : "No entries found for this category."}
                              </td>
                            </tr>
                          ) : (
                            paginatedRows.map((row, i) => {
                              const rank =
                                (currentPage - 1) * PAGE_SIZE + i + 1;
                              return (
                                <tr
                                  key={row.id}
                                  className={`group border-b transition-colors hover:bg-[var(--surface-muted)] ${
                                    rank === 1
                                      ? "rank-first font-black"
                                      : rank <= 3
                                        ? "font-bold"
                                        : "font-normal"
                                  }`}
                                  style={{
                                    ...rankRowStyle(rank, i),
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  {/* Rank */}
                                  <td className="px-6 py-3">
                                    <span
                                      className="text-sm"
                                      style={{
                                        color:
                                          rank === 1
                                            ? "var(--primary)"
                                            : "var(--text-strong)",
                                      }}
                                    >
                                      #{rank}
                                    </span>
                                  </td>

                                  {/* Avatar */}
                                  <td className="px-6 py-3">
                                    <div
                                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                                      style={{
                                        background:
                                          rank === 1
                                            ? "var(--primary)"
                                            : "var(--surface-strong)",
                                        border: "1px solid var(--border)",
                                        color:
                                          rank === 1
                                            ? "var(--button-text)"
                                            : "var(--primary)",
                                      }}
                                    >
                                      {row.name
                                        .split(" ")
                                        .slice(0, 2)
                                        .map((p) => p[0])
                                        .join("")
                                        .toUpperCase()}
                                    </div>
                                  </td>

                                  {/* Name */}
                                  <td className="px-6 py-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedId(row.id);
                                        setViewMode("profile");
                                      }}
                                      className="text-left transition"
                                    >
                                      <span
                                        className="block text-sm group-hover:text-[var(--primary)]"
                                        style={{
                                          color:
                                            rank === 1
                                              ? "var(--primary)"
                                              : "var(--text-strong)",
                                        }}
                                      >
                                        {row.name}
                                      </span>
                                    </button>
                                  </td>

                                  {/* Genre (artist only) */}
                                  {activeTab === "artist" && (
                                    <td className="px-6 py-3">
                                      <span
                                        className="text-sm"
                                        style={{ color: "var(--text-muted)" }}
                                      >
                                        {row.genre || "—"}
                                      </span>
                                    </td>
                                  )}

                                  {/* Location */}
                                  <td className="px-6 py-3">
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {activeTab === "city"
                                        ? row.country
                                        : row.location}
                                    </span>
                                  </td>

                                  {/* Rating count */}
                                  <td className="px-6 py-3 text-center">
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--foreground)" }}
                                    >
                                      {row.ratingCount}
                                    </span>
                                  </td>

                                  {/* Score */}
                                  <td className="px-6 py-3 text-right">
                                    <span
                                      className="text-sm"
                                      style={{
                                        color:
                                          rank === 1
                                            ? "var(--primary)"
                                            : "var(--text-strong)",
                                      }}
                                    >
                                      {row.averageScore.toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-center gap-6 border-t px-6 py-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-20 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface-elevated)",
                        color: "var(--foreground)",
                      }}
                    >
                      Previous
                    </button>
                    <div
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Page{" "}
                      <span
                        className="font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {currentPage}
                      </span>{" "}
                      of {totalPages}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-20 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface-elevated)",
                        color: "var(--foreground)",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </Panel>
            ) : (
              /* ── Profile view ──────────────────────────────────────── */
              <Panel className="mx-auto w-full max-w-5xl overflow-hidden p-0 shadow-[0_30px_90px_var(--shadow)]">
                <div
                  className="p-4 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => setViewMode("list")}
                    className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest transition hover:text-[var(--foreground)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ← Back to Leaderboard
                  </button>
                </div>

                {selectedRow ? (
                  <>
                    {/* Hero */}
                    <div
                      className="relative h-56 p-5 sm:h-64 sm:p-6"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--hero-from) 0%, var(--hero-via) 35%, var(--hero-to) 100%)",
                      }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
                      <div className="relative flex h-full flex-col justify-end sm:flex-row sm:items-end sm:gap-5">
                        {/* Avatar */}
                        <div
                          className="mb-4 flex h-28 w-28 items-center justify-center rounded-md text-4xl font-bold shadow-[0_18px_40px_var(--shadow)] sm:mb-0 sm:h-36 sm:w-36"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--primary), var(--primary-deep))",
                            boxShadow: "inset 0 0 0 1px var(--border)",
                            color: "var(--button-text)",
                          }}
                        >
                          {selectedRow.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div
                            className="text-xs font-medium uppercase tracking-[0.2em]"
                            style={{ color: "var(--hero-muted)" }}
                          >
                            {selectedRow.role === "venue"
                              ? "Venue"
                              : "Artist / Band"}
                          </div>
                          <h2
                            className="truncate text-3xl font-bold tracking-tight sm:text-5xl"
                            style={{ color: "var(--hero-foreground)" }}
                          >
                            {selectedRow.name}
                          </h2>
                          <p
                            className="mt-1 text-sm"
                            style={{ color: "var(--hero-muted)" }}
                          >
                            {selectedRow.location} • #
                            {rows.findIndex((r) => r.id === selectedRow.id) + 1}{" "}
                            on leaderboard
                          </p>
                          <div className="mt-3 flex flex-wrap gap-5 text-sm">
                            <ProfileMetric
                              label="Score"
                              value={`${selectedRow.averageScore.toFixed(2)}/100`}
                            />
                            <ProfileMetric
                              label="Ratings"
                              value={String(selectedRow.ratingCount)}
                            />
                            <ProfileMetric
                              label="Qualified"
                              value={
                                selectedRow.ratingCount >= 3 ? "Yes" : "No"
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr]">
                      {/* Left column */}
                      <div className="grid gap-4">
                        <Panel>
                          <div className="flex items-center justify-between gap-3">
                            <h3
                              className="text-sm font-semibold uppercase tracking-[0.18em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Performance
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowRateModal(true)}
                              className="rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90"
                              style={{
                                background: "var(--primary)",
                                color: "var(--button-text)",
                              }}
                            >
                              Rate Now
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <StatCard
                              label="Overall score"
                              value={`${selectedRow.averageScore.toFixed(2)}/100`}
                              variant="primary"
                            />
                            <StatCard
                              label="Rating count"
                              value={String(selectedRow.ratingCount)}
                              variant="muted"
                            />
                            <StatCard
                              label="Location"
                              value={selectedRow.location}
                              variant="muted"
                            />
                            <StatCard
                              label="Category"
                              value={
                                selectedRow.role === "venue"
                                  ? "Venue"
                                  : "Artist"
                              }
                              variant="subtle"
                            />
                          </div>
                        </Panel>

                        {selectedTarget && (
                          <Panel>
                            <h3
                              className="text-sm font-semibold uppercase tracking-[0.18em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Category Breakdown
                            </h3>
                            <div className="mt-4 space-y-3">
                              {(
                                [
                                  selectedTarget.stats.category1Average,
                                  selectedTarget.stats.category2Average,
                                  selectedTarget.stats.category3Average,
                                  selectedTarget.stats.category4Average,
                                ] as (number | null)[]
                              ).map((avg, idx) => {
                                if (avg === null) return null;
                                return (
                                  <CategoryBar
                                    key={idx}
                                    label={
                                      catLabels[idx] ?? `Category ${idx + 1}`
                                    }
                                    value={avg}
                                    max={100}
                                  />
                                );
                              })}
                            </div>
                          </Panel>
                        )}

                        {loadingTarget && (
                          <div
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Loading details…
                          </div>
                        )}
                      </div>

                      {/* Right column */}
                      <div className="grid gap-4">
                        <Panel
                          style={{
                            background:
                              "linear-gradient(180deg, var(--surface-strong), var(--surface))",
                          }}
                        >
                          <h3
                            className="text-sm font-semibold uppercase tracking-[0.18em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Score Insights
                          </h3>
                          <div className="mt-4 space-y-3">
                            <InsightRow
                              label="Audience signal"
                              value={
                                selectedRow.averageScore >= 84
                                  ? "Standout"
                                  : "Strong"
                              }
                            />
                            <InsightRow
                              label="Threshold status"
                              value={
                                selectedRow.ratingCount >= 3
                                  ? "Qualified"
                                  : "Early data"
                              }
                            />
                            <InsightRow
                              label="Town"
                              value={selectedRow.location}
                            />
                          </div>
                        </Panel>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="p-12 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Target not found.
                  </div>
                )}
              </Panel>
            )}
          </main>
        </EnliveShell>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "primary" | "muted" | "subtle";
}) {
  const bg: Record<string, string> = {
    primary: "linear-gradient(135deg, var(--primary-tint), var(--surface))",
    muted: "linear-gradient(135deg, var(--surface-strong), var(--surface))",
    subtle: "var(--surface-muted)",
  };
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: bg[variant] }}
    >
      <div
        className="text-xs uppercase tracking-[0.16em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 truncate text-2xl font-semibold"
        style={{ color: "var(--text-strong)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-lg font-semibold"
        style={{ color: "var(--hero-foreground)" }}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-[0.14em]"
        style={{ color: "var(--hero-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-muted)",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--text-strong)" }}>
        {value}
      </span>
    </div>
  );
}

function CategoryBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-medium" style={{ color: "var(--text-strong)" }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-muted)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--primary), var(--primary-light))",
          }}
        />
      </div>
    </div>
  );
}

function RecentRatingRow({
  score,
  createdAt,
}: {
  score: number;
  createdAt: string;
}) {
  const date = new Date(createdAt);
  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-muted)",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{formatted}</span>
      <span
        className="font-semibold"
        style={{ color: score >= 80 ? "var(--primary)" : "var(--text-strong)" }}
      >
        {score}/100
      </span>
    </div>
  );
}

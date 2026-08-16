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
    cityRank: number | null;
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
  venue: ["Sound & Technical Experience", "Atmosphere & Ambience", "Staff & Operations", "Amenities & Value"],
  artist: ["Performance Quality", "Stage Presence & Engagement", "Set & Musical Experience", "Fan Experience"],
  city: [
    "Live Music Culture",
    "Venue Density",
    "Artist Support",
    "Audience Turnout",
  ],
};

function formatOrdinal(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

import { EqualizerBackground } from "@/components/equalizer-background";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TargetType>("venue");
  const [location, setLocation] = useState<string>("All");
    // const [minRatings, setMinRatings] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [locations, setLocations] = useState<string[]>(["All"]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetDetails | null>(
    null,
  );
  const [loadingTarget, setLoadingTarget] = useState(false);
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
  }, [activeTab, location, refreshKey]);

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
  }, [activeTab, location, searchQuery]);

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
  const rankRowStyle = (rank: number): React.CSSProperties => rank <= 3
    ? { background: "color-mix(in srgb, var(--surface-elevated) 88%, var(--primary-tint))" }
    : { background: "transparent" };

  return (
    <>
      <div style={{ position: "relative" }}>
        <EqualizerBackground />
        <EnliveShell
          title="Live Music Leaderboards"
          subtitle="Public leaderboard experience. Dashboard is for signed-in venues and artists only."
          headerMode="public"
          hideHeroHeader
        >
          <main className="grid gap-8 pb-10 pt-7 sm:pt-10">
            <section className="mx-auto w-full max-w-5xl">
              <p className="enlive-eyebrow">EnLive / Public index</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-4xl font-black tracking-[-0.055em] text-[var(--text-strong)] sm:text-6xl">Live rankings</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">The live music scene, ranked by the crowd.</p>
                </div>
                <p className="enlive-eyebrow hidden pb-1 sm:block">Updated from live audience ratings</p>
              </div>
            </section>
            {/* ── Tabs + filters ───────────────────────────────────────── */}
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
              <div className="w-full max-w-2xl">
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
                  className="flex w-full max-w-2xl flex-col gap-4 border-b border-[var(--border)] pb-5"
                  style={{
                    background: "transparent",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative min-w-0 flex-1">
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
                        className="w-full rounded-md border py-2.5 pl-9 pr-4 text-sm outline-none transition"
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
                        Location
                      </label>
                      <select
                        id="town-select"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="min-h-10 rounded-md border px-3 py-1.5 text-sm outline-none cursor-pointer"
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

                  </div>
                </div>
              )}
            </div>

            {/* ── List view ────────────────────────────────────────────── */}
            {viewMode === "list" ? (
              <Panel className="mx-auto w-full max-w-5xl overflow-hidden border-x-0 p-0 shadow-none sm:border-x">
                <div className="border-b border-[var(--border)] px-4 py-3 sm:px-6">
                  <span className="enlive-eyebrow">{activeTab === "artist" ? "Artists" : activeTab === "venue" ? "Venues" : "Cities"} / ranked by EnLive score</span>
                </div>
                <div className="grid divide-y divide-[var(--border)] md:hidden">
                  {loadingRows ? (
                    <LeaderboardSkeleton />
                  ) : rowsError ? (
                    <LeaderboardMessage title="We hit a snag" message="We couldn’t load the rankings right now." action="Try again" onAction={handleLiveRefresh} danger />
                  ) : filteredRows.length === 0 ? (
                    <LeaderboardMessage title="No rankings found" message={searchQuery ? "Try another search term or location." : "Try another location."} action={(searchQuery || location !== "All") ? "Clear filters" : undefined} onAction={() => { setSearchQuery(""); setLocation("All"); }} />
                  ) : (
                    paginatedRows.map((row, i) => {
                      const rank = (currentPage - 1) * PAGE_SIZE + i + 1;
                      const roleLabel = activeTab === "city" ? "City" : activeTab === "venue" ? "Venue" : "Artist";
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(row.id);
                            setViewMode("profile");
                          }}
                          className={`grid min-h-28 grid-cols-[2.75rem_1fr_auto] items-center gap-3 px-4 py-5 text-left transition active:bg-[var(--surface-muted)] ${rank <= 3 ? "" : ""}`}
                          style={{
                            ...rankRowStyle(rank),
                            borderColor: "var(--border)",
                          }}
                        >
                          <div className="contents">
                            <div className="text-xl font-black tracking-[-0.06em] text-[var(--text-muted)]">{String(rank).padStart(2, "0")}</div>
                            <div className="min-w-0">
                              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                                {roleLabel} · {row.ratingCount} ratings
                              </div>
                              <div className={`mt-1 truncate font-bold tracking-tight ${rank <= 3 ? "text-xl" : "text-lg"}`} style={{ color: "var(--text-strong)" }}>
                                {row.name}
                              </div>
                              <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                {activeTab === "artist" && row.genre ? `${row.genre} · ` : ""}
                                {activeTab === "city" ? row.country : row.location}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className={`font-black tracking-[-0.06em] ${rank <= 3 ? "text-3xl" : "text-2xl"}`} style={{ color: rank === 1 ? "var(--primary)" : "var(--text-strong)" }}>
                                {row.averageScore.toFixed(2)}
                              </div>
                              <div className="text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                                EnLive score
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="hidden md:block">
                  {(() => {
                    const totalCols = activeTab === "artist" ? 6 : 5;
                    return (
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr
                            className="border-b"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <th
                              className="w-20 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Rank
                            </th>
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
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>Ratings</th>

                            <th
                              className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              EnLive score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingRows ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-8"
                                style={{ color: "var(--text-muted)" }}
                              ><LeaderboardSkeleton /></td>
                            </tr>
                          ) : rowsError ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-8"
                              ><LeaderboardMessage title="We hit a snag" message="We couldn’t load the rankings right now." action="Try again" onAction={handleLiveRefresh} danger /></td>
                            </tr>
                          ) : filteredRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={totalCols}
                                className="px-6 py-8"
                              ><LeaderboardMessage title="No rankings found" message={searchQuery ? "Try another search term or location." : "Try another location."} action={(searchQuery || location !== "All") ? "Clear filters" : undefined} onAction={() => { setSearchQuery(""); setLocation("All"); }} /></td>
                            </tr>
                          ) : (
                            paginatedRows.map((row, i) => {
                              const rank =
                                (currentPage - 1) * PAGE_SIZE + i + 1;
                              return (
                                <tr
                                  key={row.id}
                                  className={`group border-b transition-colors hover:bg-[var(--surface-muted)] ${
                                    rank <= 3 ? "font-bold" : "font-normal"
                                  }`}
                                  style={{
                                    ...rankRowStyle(rank),
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  {/* Rank */}
                                  <td className="px-6 py-5">
                                    <span
                                      className="text-xl font-black tracking-[-0.06em]"
                                      style={{
                                        color:
                                          rank === 1
                                            ? "var(--primary)"
                                            : "var(--text-strong)",
                                      }}
                                    >
                                      {String(rank).padStart(2, "0")}
                                    </span>
                                  </td>

                                  {/* Name */}
                                  <td className="px-6 py-5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedId(row.id);
                                        setViewMode("profile");
                                      }}
                                      className="text-left transition"
                                    >
                                      <span
                                        className={`block tracking-tight group-hover:text-[var(--primary)] ${rank <= 3 ? "text-xl" : "text-base"}`}
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
                                    <td className="px-6 py-5">
                                      <span
                                        className="text-sm"
                                        style={{ color: "var(--text-muted)" }}
                                      >
                                        {row.genre || "—"}
                                      </span>
                                    </td>
                                  )}

                                  {/* Location */}
                                  <td className="px-6 py-5">
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {activeTab === "city"
                                        ? row.country
                                        : row.location}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 text-sm text-[var(--text-muted)]">{row.ratingCount}</td>

                                  {/* Score */}
                                  <td className="px-6 py-5 text-right">
                                    <span
                                      className={`font-black tracking-[-0.06em] ${rank <= 3 ? "text-3xl" : "text-2xl"}`}
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
                    className="flex flex-col items-stretch justify-center gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="min-h-11 rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-20 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface-elevated)",
                        color: "var(--foreground)",
                      }}
                    >
                      Previous
                    </button>
                    <div
                      className="text-center text-xs uppercase tracking-widest"
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
                      className="min-h-11 rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-20 hover:border-[var(--primary)] hover:text-[var(--primary)]"
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
                    className="flex min-h-10 items-center gap-2 text-xs font-medium uppercase tracking-widest transition hover:text-[var(--foreground)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ← Back to Leaderboard
                  </button>
                </div>

                {selectedRow ? (
                  <>
                    {/* Hero */}
                    <div
                      className="relative min-h-56 p-5 sm:h-64 sm:p-6"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--hero-from) 0%, var(--hero-via) 35%, var(--hero-to) 100%)",
                      }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
                      <div className="relative flex h-full flex-col justify-end sm:flex-row sm:items-end sm:gap-5">
                        {/* Avatar */}
                        <div
                          className="mb-4 flex h-24 w-24 items-center justify-center rounded-md text-3xl font-bold shadow-[0_18px_40px_var(--shadow)] sm:mb-0 sm:h-36 sm:w-36 sm:text-4xl"
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
                            className="break-words text-3xl font-bold tracking-tight sm:text-5xl"
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
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <StatCard
                              label="Overall score"
                              value={`${selectedRow.averageScore.toFixed(2)}/100`}
                              variant="primary"
                            />

                            <StatCard
                              label="Location"
                              value={selectedRow.location}
                              variant="muted"
                            />
                            {selectedTarget?.stats.cityRank ? (
                              <StatCard
                                label="City rank"
                                value={`${formatOrdinal(selectedTarget.stats.cityRank)} in ${selectedRow.location}`}
                                variant="subtle"
                              />
                            ) : null}
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

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 px-4 py-6" aria-label="Loading rankings" role="status">
      {[0, 1, 2, 3].map((row) => <div key={row} className="grid grid-cols-[2.75rem_1fr_4rem] items-center gap-3 py-3">
        <span className="h-5 w-7 animate-pulse rounded bg-[var(--surface-muted)]" />
        <span className="block space-y-2"><span className="block h-4 w-2/5 animate-pulse rounded bg-[var(--surface-muted)]" /><span className="block h-3 w-1/3 animate-pulse rounded bg-[var(--surface-muted)]" /></span>
        <span className="h-8 animate-pulse rounded bg-[var(--surface-muted)]" />
      </div>)}
      <span className="sr-only">Loading rankings</span>
    </div>
  );
}

function LeaderboardMessage({ title, message, action, onAction, danger = false }: { title: string; message: string; action?: string; onAction: () => void; danger?: boolean }) {
  return <div className="px-4 py-14 text-center">
    <p className="enlive-eyebrow" style={{ color: danger ? "var(--danger)" : undefined }}>{title}</p>
    <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p>
    {action ? <button type="button" onClick={onAction} className="mt-5 min-h-10 border-b border-[var(--primary)] px-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">{action}</button> : null}
  </div>;
}

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
  value: number | null;
  max: number;
}) {
  const pct = value === null ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-medium" style={{ color: "var(--text-strong)" }}>
          {value === null ? "No data yet" : `${value.toFixed(1)}/100`}
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EnliveShell, Panel } from "@/components/enlive-shell";

type TargetType = "venue" | "artist" | "city";

type Target = {
  id: string;
  enliveUid: string | null;
  name: string;
  role: TargetType;
  location: string;
  genre: string | null;
  bio: string | null;
  createdAt: string;
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

const CATEGORY_LABELS: Record<TargetType, string[]> = {
  artist: ["Performance", "Stage Presence", "Setlist", "Crowd Engagement"],
  venue: ["Atmosphere", "Sound Quality", "Staff", "Value"],
  city: ["Live Music Culture", "Venue Density", "Artist Support", "Audience Turnout"],
};

const GENRES = [
  "Alternative", "Americana", "Blues", "Classical", "Country", "Dream Pop",
  "Electronic", "Folk", "Funk", "House", "Indie Rock", "Jazz Fusion",
  "Psych Rock", "R&B", "Soul", "Surf Rock", "Synthpop", "Other",
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-semibold" style={{ color: "var(--foreground)" }}>
          {value.toFixed(1)} <span style={{ color: "var(--text-muted)" }}>/ 5</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
        />
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <div className="mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
      {children}
    </label>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TargetProfilePage() {
  const params = useParams<{ id: string }>();

  const [target, setTarget] = useState<Target | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [genre, setGenre] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Share button
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user: { id: string } | null }) => setSessionUserId(d.user?.id ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/targets/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { target?: Target; error?: string };
        if (!res.ok || !data.target) throw new Error(data.error ?? "Not found.");
        if (!cancelled) {
          setTarget(data.target);
          setName(data.target.name);
          setLocation(data.target.location);
          setGenre(data.target.genre ?? "");
          setBio(data.target.bio ?? "");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Not found.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return (
      <EnliveShell title="Profile" hideHeroHeader>
        <div className="flex h-64 items-center justify-center">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</span>
        </div>
      </EnliveShell>
    );
  }

  if (!target) {
    return (
      <EnliveShell title="Profile" hideHeroHeader>
        <Panel className="mx-auto max-w-sm text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error ?? "Profile not found."}</p>
          <Link href="/" className="mt-3 inline-block text-sm hover:opacity-80" style={{ color: "var(--primary)" }}>
            ← Back to leaderboard
          </Link>
        </Panel>
      </EnliveShell>
    );
  }

  const isOwner = !!sessionUserId && sessionUserId === target.id;
  const roleLabel = target.role === "venue" ? "Venue" : target.role === "city" ? "City" : "Artist / Band";
  const initials = target.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const catLabels = CATEGORY_LABELS[target.role];

  const catBars: Array<{ label: string; value: number }> = [
    { label: catLabels[0], value: target.stats.category1Average },
    { label: catLabels[1], value: target.stats.category2Average },
    { label: catLabels[2], value: target.stats.category3Average },
    ...(target.stats.category4Average !== null
      ? [{ label: catLabels[3], value: target.stats.category4Average }]
      : []),
  ];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location, genre: genre || undefined, bio: bio || undefined }),
    })
      .then(async (res) => {
        const d = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(d.error ?? "Save failed.");
        setTarget((prev) => prev ? { ...prev, name, location, genre, bio } : prev);
        setSaveSuccess(true);
        setEditing(false);
      })
      .catch((e: unknown) => setSaveError(e instanceof Error ? e.message : "Save failed."))
      .finally(() => setSaving(false));
  }

  function cancelEdit() {
    if (!target) return;
    setName(target.name);
    setLocation(target.location);
    setGenre(target.genre ?? "");
    setBio(target.bio ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(false);
  }

  return (
    <EnliveShell title={target.name} subtitle={`${roleLabel} · ${target.location}`} hideHeroHeader>
      <main className="mx-auto w-full max-w-3xl space-y-4">

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-2xl border shadow-[0_8px_32px_var(--shadow)]"
          style={{
            borderColor: "var(--border)",
            background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, white 12%), var(--surface))",
          }}
        >
          {/* Cover banner */}
          <div
            className="relative h-28 w-full"
            style={{
              background: "linear-gradient(135deg, var(--base-deep) 0%, var(--primary) 45%, var(--secondary) 75%, var(--accent) 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Avatar + action row */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between" style={{ marginTop: "-40px" }}>
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-bold shadow-lg select-none"
                style={{
                  borderColor: "var(--surface)",
                  background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                  color: "var(--button-text)",
                }}
              >
                {initials}
              </div>

              {isOwner && !editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(true); setSaveSuccess(false); setSaveError(null); }}
                  className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "transparent" }}
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61ZM2.625 13.376l2.128-.608-1.52-1.52-.608 2.128Z" />
                  </svg>
                  Edit profile
                </button>
              )}
              {isOwner && editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Identity */}
            <div className="mt-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                  {target.name}
                </h1>
                {target.enliveUid && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-mono font-medium"
                    style={{ background: "var(--surface-muted)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    {target.enliveUid}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
                {roleLabel}{target.genre ? ` · ${target.genre}` : ""}
              </p>
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true">
                  <path d="M8 0a5.53 5.53 0 0 0-5.5 5.5c0 3.036 5.5 10.5 5.5 10.5S13.5 8.536 13.5 5.5A5.53 5.53 0 0 0 8 0Zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                </svg>
                {target.location}
              </div>
              {target.bio ? (
                <p className="pt-1 text-sm italic leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {target.bio}
                </p>
              ) : isOwner && !editing ? (
                <p className="pt-1 text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  No bio yet. Click "Edit profile" to add one.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Stats + Rate ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Stats */}
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
              Rating Overview
            </h2>
            {target.stats.totalRatings === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                No ratings yet. Be the first to rate!
              </p>
            ) : (
              <>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                    {target.stats.averageScore.toFixed(1)}
                  </span>
                  <span className="text-lg" style={{ color: "var(--text-muted)" }}>/100</span>
                </div>
                <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  {target.stats.totalRatings} {target.stats.totalRatings === 1 ? "rating" : "ratings"}
                </p>
                <div className="space-y-3">
                  {catBars.map(({ label, value }) => (
                    <CategoryBar key={label} label={label} value={value} />
                  ))}
                </div>
              </>
            )}
          </Panel>

          {/* Rate + Share */}
          <Panel className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                Submit a Rating
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Ratings are anonymous and help build an accurate picture of{" "}
                {target.role === "venue" ? "this venue" : target.role === "city" ? "this city's music scene" : "this artist"}.
              </p>
            </div>
            <Link
              href={`/rate/${target.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--button-text)" }}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
              </svg>
              Rate {target.role === "venue" ? "this venue" : target.role === "city" ? "this city" : "this artist"}
            </Link>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface-muted)", color: "var(--text-muted)" }}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5Zm5.75.56v2.19c0 .138.112.25.25.25h2.19ZM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25Z" />
              </svg>
              {copied ? "Link copied!" : "Copy profile link"}
            </button>
          </Panel>
        </div>

        {/* ── Owner edit form ───────────────────────────────────────────────── */}
        {isOwner && editing && (
          <Panel>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Edit Profile
            </h2>
            <form className="space-y-5" onSubmit={(e) => { void handleSave(e); }}>
              <Field label="Name" htmlFor="ep-name">
                <input
                  id="ep-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                />
              </Field>

              <Field label="Town / City" htmlFor="ep-location">
                <input
                  id="ep-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                />
              </Field>

              {target.role === "artist" && (
                <Field label="Genre" htmlFor="ep-genre">
                  <select
                    id="ep-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                  >
                    <option value="">Select a genre</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              )}

              <Field label="Bio" htmlFor="ep-bio">
                <textarea
                  id="ep-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Write a short bio or description…"
                  className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                />
                <p className="mt-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>{bio.length}/500</p>
              </Field>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "var(--button-text)" }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>

              {saveSuccess && (
                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>✓ Profile updated.</p>
              )}
              {saveError && (
                <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{saveError}</p>
              )}
            </form>
          </Panel>
        )}

        {/* ── Recent ratings ────────────────────────────────────────────────── */}
        {target.recentRatings.length > 0 && (
          <Panel>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
              Recent Ratings
            </h2>
            <div className="space-y-2">
              {target.recentRatings.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: "var(--surface-muted)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
                    {r.overallScore.toFixed(1)}
                    <span className="ml-0.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>/100</span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <div className="pb-2">
          <Link
            href="/"
            className="text-xs transition hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ← Back to leaderboard
          </Link>
        </div>

      </main>
    </EnliveShell>
  );
}

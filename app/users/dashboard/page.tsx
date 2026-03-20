"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EnliveShell, Panel } from "@/components/enlive-shell";

type UserData = {
  user: { id: string; name: string; email: string; role: string; location: string };
  target: {
    stats: {
      totalRatings: number;
      averageScore: number;
      category1Average: number;
      category2Average: number;
      category3Average: number;
      category4Average: number | null;
    };
  } | null;
};

const CATEGORY_LABELS: Record<string, string[]> = {
  venue: ["Atmosphere", "Sound Quality", "Staff", "Value"],
  artist: ["Performance", "Stage Presence", "Setlist", "Crowd Engagement"],
};

export default function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) { router.push("/users/auth/login"); return; }
        const json = (await res.json()) as UserData;
        setData(json);
      })
      .catch(() => router.push("/users/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,var(--shell-from),var(--shell-mid)_48%,var(--shell-to))]">
        <span className="text-sm text-[var(--text-muted)]">Loading…</span>
      </div>
    );
  }

  if (!data) return null;

  const { user, target } = data;
  const stats = target?.stats;
  const catLabels = CATEGORY_LABELS[user.role] ?? [];
  const qualified = (stats?.totalRatings ?? 0) >= 3;

  return (
    <EnliveShell title={user.name} subtitle={`${user.role === "venue" ? "Venue" : "Artist / Band"} · ${user.location}`}>
      <main className="grid gap-5 lg:grid-cols-[1fr_1fr]">

        {/* Score overview */}
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Your Score
            </h2>
            <Link
              href="/users/profile"
              className="rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface-muted)", color: "var(--foreground)" }}
            >
              Edit profile
            </Link>
          </div>

          {stats ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Overall score" value={`${stats.averageScore.toFixed(2)}/100`} accent />
              <Stat label="Total ratings" value={String(stats.totalRatings)} />
              <Stat label="Location" value={user.location} />
              <Stat label="Threshold" value={qualified ? "Qualified" : "Early data"} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No ratings yet. Share your profile link to start collecting scores.
            </p>
          )}
        </Panel>

        {/* Category breakdown */}
        {stats && catLabels.length > 0 && (
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Category Breakdown
            </h2>
            <div className="mt-4 space-y-3">
              {[stats.category1Average, stats.category2Average, stats.category3Average, stats.category4Average]
                .map((avg, i) => avg !== null && avg !== undefined ? (
                  <CategoryBar key={i} label={catLabels[i] ?? `Category ${i + 1}`} value={avg} />
                ) : null)}
            </div>
          </Panel>
        )}

        {/* Quick links */}
        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Quick Links
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <QuickLink href="/" label="Leaderboard" />
            <QuickLink href={`/rate/${user.id}`} label="Your rating page" />
          </div>
        </Panel>

      </main>
    </EnliveShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: "var(--border)",
        background: accent
          ? "color-mix(in srgb, var(--primary) 14%, var(--surface))"
          : "var(--surface-muted)",
      }}
    >
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round((value / 5) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-medium text-[var(--foreground)]">{value.toFixed(1)}/5</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--accent, var(--primary)))" }}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border px-4 py-2 text-sm transition hover:opacity-80"
      style={{ borderColor: "var(--border)", background: "var(--surface-muted)", color: "var(--foreground)" }}
    >
      {label}
    </Link>
  );
}

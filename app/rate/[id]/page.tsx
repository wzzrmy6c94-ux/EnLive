"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { QrCodeGenerator } from "@/components/QrCodeGenerator";
import { CEILING_SWEEP_ERROR, isCeilingSweepRating } from "@/lib/rating-quality";

type Target = {
  id: string;
  name: string;
  role: "venue" | "artist";
  location: string;
  emailVerified: boolean;
};

type RatingValues = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
};

type RatingCategory = {
  label: string;
  low: string;
  high: string;
};

const SCORE_SCALE = { min: 0, max: 100 } as const;

const RATING_CATEGORIES: Record<Target["role"], RatingCategory[]> = {
  venue: [
    { label: "Sound & Technical Experience", low: "Painful", high: "Crystal clear" },
    { label: "Atmosphere & Ambience", low: "Flat", high: "Electric" },
    { label: "Staff & Operations", low: "Chaotic", high: "Seamless" },
    { label: "Amenities & Value", low: "Not worth it", high: "Worth it" },
  ],
  artist: [
    { label: "Performance Quality", low: "Rough", high: "Flawless" },
    { label: "Stage Presence & Engagement", low: "Awkward", high: "Captivating" },
    { label: "Set & Musical Experience", low: "Forgettable", high: "Unforgettable" },
    { label: "Fan Experience", low: "Disconnected", high: "Unreal" },
  ],
};

function sliderPercent(value: number) {
  return ((value - SCORE_SCALE.min) / (SCORE_SCALE.max - SCORE_SCALE.min)) * 100;
}

function RatingSkeleton() {
  return <main className="mx-auto w-full max-w-3xl space-y-8 py-10" aria-label="Loading rating form" role="status">
    <section className="border-b border-[var(--border)] pb-7"><div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" /><div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-[var(--surface-muted)]" /><div className="mt-3 h-4 w-40 animate-pulse rounded bg-[var(--surface-muted)]" /></section>
    <section className="space-y-6">{[0, 1, 2, 3].map((row) => <div key={row} className="border-b border-[var(--border)] py-6"><div className="flex justify-between"><div className="h-5 w-48 animate-pulse rounded bg-[var(--surface-muted)]" /><div className="h-8 w-12 animate-pulse rounded bg-[var(--surface-muted)]" /></div><div className="mt-6 h-2 animate-pulse rounded bg-[var(--surface-muted)]" /></div>)}</section>
    <span className="sr-only">Loading rating form</span>
  </main>;
}

export default function RatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrToken = searchParams?.get('qrToken');
  const [qrError, setQrError] = useState<string | null>(null);

  const [target, setTarget] = useState<Target | null>(null);
  const [me, setMe] = useState<{userId: string} | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<RatingValues>({ c1: 50, c2: 50, c3: 50, c4: 50 });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Check if owner
    fetch('/api/me', { cache: 'no-store' })
      .then(res => res.json())
      .then((data: {user: {id: string}}) => {
        if (cancelled) return;
        setMe({userId: data.user.id});
      })
      .catch(() => {});

    // sourcery skip: avoid-function-declarations-in-blocks
    async function init() {
      // If QR token provided, validate it via API
      if (qrToken) {
        try {
          const res = await fetch('/api/qr/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: qrToken, validate: true }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Invalid QR token');
          }
        } catch (e) {
          if (!cancelled) {
            setQrError(e instanceof Error ? e.message : 'Invalid QR token');
            setLoading(false);
          }
          return;
        }
      }

      // Load target
      try {
        const res = await fetch(`/api/targets/${params.id}`);
        const data = (await res.json()) as { target?: Target; error?: string };
        if (!res.ok || !data.target) throw new Error(data.error || "Target not found.");
        if (!cancelled) setTarget(data.target);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Target not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [params.id, qrToken]);

  // Set isOwner when both me and target ready
  useEffect(() => {
    if (me && target) {
      setIsOwner(me.userId === target.id);
    }
  }, [me, target]);

  if (qrError) {
    return (
      <EnliveShell title="Invalid QR" subtitle="" headerMode="public">
        <Panel className="mx-auto mt-12 max-w-md text-center shadow-none">
          <p className="enlive-eyebrow text-[var(--danger)]">This link is unavailable</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">This rating link can’t be used right now.</p>
          <Link href="/" className="mt-5 inline-flex border-b border-[var(--primary)] pb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">Back to EnLive</Link>
        </Panel>
      </EnliveShell>
    );
  }

  if (loading) {
    return (
      <EnliveShell title="Rating Link" subtitle="Public QR submission form" headerMode="public">
        <RatingSkeleton />
      </EnliveShell>
    );
  }

  if (!target) {
    return (
      <EnliveShell title="Rating Link" subtitle="Public QR submission form" headerMode="public">
        <Panel className="mx-auto mt-12 max-w-md text-center shadow-none">
          <p className="enlive-eyebrow text-[var(--danger)]">Rating unavailable</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">We couldn’t load this rating form right now.</p>
          <Link href="/" className="mt-5 inline-flex border-b border-[var(--primary)] pb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">Back to leaderboard</Link>
        </Panel>
      </EnliveShell>
    );
  }

  if (isOwner) {
    return (
      <EnliveShell
        title={`Manage ${target.name}`}
        subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Generate QR for ratings`}
        headerMode="private"
      >
        <main className="flex justify-center py-8 sm:py-12">
          <Panel className="w-full max-w-md space-y-5 shadow-none">
            <div className="text-center">
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>QR Code Generator</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{target.name}</p>
            </div>
            <QrCodeGenerator targetId={target.id} targetName={target.name} />
            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            <Link href={`/target/${target.id}`} className="block text-center text-sm underline" style={{ color: "var(--text-muted)" }}>← Back to profile</Link>
          </Panel>
        </main>
      </EnliveShell>
    );
  }

  if (!target.emailVerified) {
    return (
      <EnliveShell
        title={`Rate ${target.name}`}
        subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Public QR submission form`}
        headerMode="public"
      >
        <main className="flex justify-center py-8 sm:py-12">
          <Panel className="w-full max-w-md space-y-4 text-center shadow-none">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Rating form inactive</div>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{target.name}</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              This EnLive rating form exists, but ratings are not open until the profile email has been verified.
            </p>
            <Link href="/" className="inline-flex text-sm font-semibold text-[var(--primary)] transition hover:opacity-80">
              Back to EnLive
            </Link>
          </Panel>
        </main>
      </EnliveShell>
    );
  }

  const categories = RATING_CATEGORIES[target.role];

  return (
    <EnliveShell
      title={`Rate ${target.name}`}
      subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Public QR submission form`}
      headerMode="public"
    >
      <main className="mx-auto w-full max-w-3xl py-6 sm:py-10">
        <form
          className="space-y-8"
          onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setMessage(null);
              const scores = [values.c1, values.c2, values.c3, values.c4];
              if (isCeilingSweepRating(scores)) {
                setError(CEILING_SWEEP_ERROR);
                return;
              }
              const body = {
                targetId: target.id,
                category1: values.c1,
                category2: values.c2,
                category3: values.c3,
                category4: values.c4,
              };
              try {
                const res = await fetch('/api/ratings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = (await res.json()) as { error?: string; rating?: { overallScore: number } };
                if (!res.ok || !data.rating) throw new Error(data.error || 'Failed to submit rating.');
                setMessage("Thanks. Your rating was recorded.");
                if (qrToken) {
                  await fetch('/api/qr/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: qrToken }),
                  });
                }
                window.setTimeout(() => router.push('/'), 900);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to submit rating.');
              }
            }}
          >
            <section className="border-b border-[var(--border)] pb-7">
              <p className="enlive-eyebrow">Rate {target.role === "venue" ? "venue" : "artist"}</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-[var(--text-strong)] sm:text-6xl">{target.name}</h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{target.role === "venue" ? "Venue" : "Artist / Band"} · {target.location}</p>
              <div className="mt-6 max-w-2xl border-l-2 border-[var(--primary)] pl-4 text-sm leading-6 text-[var(--text-secondary)]">
                <p>EnLive ratings are not reviews. They are live performance rankings.</p>
                <p className="mt-2">Be fair, not polite. A fair 68 is more useful than a polite 95. Save 90+ for rare standout experiences.</p>
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
                <h2 className="enlive-eyebrow">Your rating</h2>
                <span className="text-xs text-[var(--text-muted)]">{categories.length} categories</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
              {categories.map((category, index) => {
              const key = `c${index + 1}` as keyof RatingValues;
              const value = values[key];
              const pct = sliderPercent(value);

              return (
                <label
                  key={category.label}
                  className="block py-6 first:pt-5 sm:py-7"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="text-base font-bold tracking-tight text-[var(--foreground)]">{category.label}</span>
                    <output className="min-w-12 text-right text-3xl font-black tracking-[-0.06em] text-[var(--primary)]" aria-label={`${category.label}: ${value}`}>{value}</output>
                  </div>
                  <input
                    type="range"
                    min={SCORE_SCALE.min}
                    max={SCORE_SCALE.max}
                    step="any"
                    value={value}
                    aria-label={category.label}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setValues((prev) => ({ ...prev, [key]: next }));
                    }}
                    className="enlive-rating-slider h-10 w-full cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, var(--primary) 0%, var(--primary) ${pct}%, var(--surface-elevated) ${pct}%, var(--surface-elevated) 100%)`,
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between gap-4 text-xs font-medium text-[var(--text-muted)]">
                    <span>{category.low}</span>
                    <span>{category.high}</span>
                  </div>
                </label>
              );
              })}
              </div>
            </section>

            {error ? <p role="alert" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{error}</p> : null}
            {message ? <p aria-live="polite" className="border-l-2 border-[var(--success)] pl-3 text-sm text-[var(--success)]">{message}</p> : null}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center">
              <button type="submit" className="min-h-12 rounded-md px-5 py-3 text-sm font-bold transition hover:opacity-90" style={{ background: "var(--primary)", color: "var(--button-text)" }}>
                Submit rating
              </button>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center text-sm text-[var(--text-muted)] hover:opacity-80 sm:min-h-0">Cancel</Link>
            </div>
        </form>
      </main>
    </EnliveShell>
  );
}

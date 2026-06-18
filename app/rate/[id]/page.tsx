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
        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
          <p className="text-sm text-[var(--primary)]">{qrError}</p>
          <Link href="/" className="mt-3 inline-flex text-sm text-[var(--primary)] hover:opacity-80">Back to home</Link>
        </Panel>
      </EnliveShell>
    );
  }

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

  if (isOwner) {
    return (
      <EnliveShell
        title={`Manage ${target.name}`}
        subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Generate QR for ratings`}
        headerMode="private"
      >
        <main className="flex justify-center py-8">
          <Panel className="w-full max-w-md space-y-4">
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

  const categories = RATING_CATEGORIES[target.role];

  return (
    <EnliveShell
      title={`Rate ${target.name}`}
      subtitle={`${target.role === "venue" ? "Venue" : "Artist/Band"} • ${target.location} • Public QR submission form`}
      headerMode="public"
    >
      {/* Center the rating form */}
      <main className="flex justify-center py-8">
        <Panel className="w-full max-w-md">
          <form
            className="space-y-4"
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
            {categories.map((category, index) => {
              const key = `c${index + 1}` as keyof RatingValues;
              const value = values[key];
              const pct = sliderPercent(value);

              return (
                <label
                  key={category.label}
                  className="block rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}
                >
                  <div className="mb-3 text-sm font-medium text-[var(--foreground)]">{category.label}</div>
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
                    className="enlive-rating-slider h-6 w-full cursor-pointer rounded-full"
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
      </main>
    </EnliveShell>
  );
}

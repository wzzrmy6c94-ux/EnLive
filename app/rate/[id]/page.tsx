"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { CATEGORY_LABELS, SCORE_SCALE } from "@/lib/enlive-store";

type Target = {
  id: string;
  name: string;
  role: "venue" | "artist";
  location: string;
};

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
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generatedQrToken, setGeneratedQrToken] = useState<string | null>(null);
  const [values, setValues] = useState<{ c1: number; c2: number; c3: number; c4: string }>({ c1: 4, c2: 4, c3: 4, c4: "" });
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
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Generate QR for fans/visitors to rate your {target.role}.</p>
            </div>
            <button
              onClick={async () => {
                setQrLoading(true);
                try {
                  const res = await fetch('/api/qr/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetId: target.id }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setQrUrl(data.imageUrl);
                    setGeneratedQrToken(data.token);
                  } else {
                    setError(data.error || 'Failed to generate QR');
                  }
                } catch (err) {
                  setError('Failed to generate QR');
                } finally {
                  setQrLoading(false);
                }
              }}
              disabled={qrLoading}
              className="w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--button-text)" }}
            >
              {qrLoading ? 'Generating...' : 'Generate QR Code'}
            </button>
            {qrUrl && (
              <div className="space-y-3">
                <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl shadow-lg max-w-[200px] w-full" />
                <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Token: <code>{generatedQrToken}</code>
                </div>
                <div className="flex gap-2">
                  <a href={qrUrl} download={`enlive-${target.name.replace(/\\s+/g, '-').toLowerCase()}-qr.png`} className="flex-1 rounded-xl py-2 text-xs font-semibold text-center transition" style={{ background: "var(--surface-strong)", color: "var(--foreground)" }}>Download PNG</a>
                  <Link href={`/target/${target.id}`} className="flex-1 rounded-xl py-2 text-xs font-semibold text-center transition bg-[var(--primary)] text-[var(--button-text)]">View Profile</Link>
                </div>
              </div>
            )}
            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            <Link href={`/target/${target.id}`} className="block text-center text-sm underline" style={{ color: "var(--text-muted)" }}>← Back to profile</Link>
          </Panel>
        </main>
      </EnliveShell>
    );
  }

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
              const body = {
                targetId: target.id,
                category1: values.c1,
                category2: values.c2,
                category3: values.c3,
                category4: values.c4 === "" ? undefined : Number(values.c4),
              };
              try {
                const res = await fetch('/api/ratings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = (await res.json()) as { error?: string; rating?: { overallScore: number } };
                if (!res.ok || !data.rating) throw new Error(data.error || 'Failed to submit rating.');
                setMessage(`Thanks. Your rating was recorded with overall score ${data.rating.overallScore.toFixed(2)}/100.`);
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
            {/* Use sliders for the first three categories */}
            {[1, 2, 3].map((idx) => (
              <label key={idx} className="block rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                <div className="mb-2 text-sm font-medium text-[var(--foreground)]">{CATEGORY_LABELS[idx - 1]}</div>
                <input
                  type="range"
                  min={SCORE_SCALE.min}
                  max={SCORE_SCALE.max}
                  step={1}
                  value={values[`c${idx}` as "c1" | "c2" | "c3"]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [`c${idx}`]: Number(e.target.value) } as typeof prev))}
                  className="w-full"
                />
                <div className="mt-1 text-center text-sm text-[var(--foreground)]">{values[`c${idx}` as "c1" | "c2" | "c3"]}</div>
              </label>
            ))}

            {/* Category 4 remains optional – keep a simple select */}
            <label className="block rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
              <div className="mb-2 text-sm font-medium text-[var(--foreground)]">{CATEGORY_LABELS[3]}</div>
              <select
                value={values.c4}
                onChange={(e) => setValues((prev) => ({ ...prev, c4: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
              >
                <option value="">Skip this category</option>
                {Array.from({ length: SCORE_SCALE.max - SCORE_SCALE.min + 1 }, (_, i) => SCORE_SCALE.min + i).map((score) => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </label>

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

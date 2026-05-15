"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EnliveShell } from "@/components/enlive-shell";

const GENRES = [
  "Alternative", "Americana", "Blues", "Classical", "Country", "Dream Pop",
  "Electronic", "Folk", "Funk", "House", "Indie Rock", "Jazz Fusion",
  "Psych Rock", "R&B", "Soul", "Surf Rock", "Synthpop", "Other",
];

type User = { id: string; name: string; email: string; role: string; location: string; genre?: string; square_subscription_id?: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetch("/api/users/profile", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) { router.push("/users/auth/login"); return; }
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setName(data.user.name);
        setLocation(data.user.location);
        setGenre(data.user.genre ?? "");
      })
      .catch(() => router.push("/users/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, genre: genre || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setUser((prev) => prev ? { ...prev, name, location, genre } : prev);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,var(--shell-from),var(--shell-mid)_48%,var(--shell-to))]">
        <span className="text-sm text-[var(--text-muted)]">Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <EnliveShell title="Profile" hideHeroHeader>
        <main className="mx-auto w-full max-w-2xl space-y-4">
          {/* ── LinkedIn-style profile card ── */}
          <div
            className="rounded-2xl border overflow-hidden shadow-[0_8px_32px_var(--shadow)]"
            style={{ borderColor: "var(--border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, white 12%), var(--surface))" }}
          >
            {/* Cover banner */}
            <div
              className="h-32 w-full relative"
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

            {/* Avatar + edit button row */}
            <div className="px-6 pb-5">
              <div className="flex items-end justify-between" style={{ marginTop: "-42px" }}>
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-2xl font-bold shadow-lg select-none"
                  style={{
                    borderColor: "var(--surface)",
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    color: "var(--button-text)",
                  }}
                >
                  {initials}
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "transparent" }}
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61ZM2.625 13.376l2.128-.608-1.52-1.52-.608 2.128Z" />
                  </svg>
                  Edit profile
                </button>
              </div>

              <div className="mt-3 space-y-0.5">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                  {user.name}
                </h1>
                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
                  {user.square_subscription_id ? (
                    <p className="text-sm" style={{ color: "var(--primary)" }}>Subscription active</p>
                  ) : null}
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current shrink-0" aria-hidden="true">
                    <path d="M8 0a5.53 5.53 0 0 0-5.5 5.5c0 3.036 5.5 10.5 5.5 10.5S13.5 8.536 13.5 5.5A5.53 5.53 0 0 0 8 0Zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                  {user.location}
                </div>
                <p className="pt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="pb-2">
            <button
              type="button"
              onClick={() => router.push("/users/dashboard")}
              className="text-xs transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              ← Back to dashboard
            </button>
          </div>
        </main>
      </EnliveShell>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ top: '20%' }}
          >
            <div
              className="w-full max-w-md rounded-2xl border p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
              style={{
                borderColor: "var(--border)",
                background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, white 12%), var(--surface))",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Edit Profile
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full p-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSave}>
                <Field label="Name" htmlFor="name-modal">
                  <input
                    id="name-modal"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                  />
                </Field>

                <Field label="Town / City" htmlFor="location-modal">
                  <input
                    id="location-modal"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                  />
                </Field>

                {user?.role === "artist" && (
                  <Field label="Genre" htmlFor="genre-modal">
                    <select
                      id="genre-modal"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none cursor-pointer transition focus:ring-2 focus:ring-[var(--primary)]"
                      style={{ borderColor: "var(--border)", background: "var(--surface-elevated)", color: "var(--foreground)" }}
                    >
                      <option value="">Select a genre</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 flex-1"
                    style={{ background: "var(--primary)", color: "var(--button-text)" }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName(user!.name);
                      setLocation(user!.location);
                      setGenre(user!.genre ?? "");
                      setError(null);
                      setSuccess(false);
                      setShowEditModal(false);
                    }}
                    className="px-5 py-2.5 text-sm font-semibold transition rounded-xl border"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
                  >
                    Cancel
                  </button>
                </div>

                {success && (
                  <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>✓ Profile updated.</p>
                )}
                {error && (
                  <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{error}</p>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </>
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

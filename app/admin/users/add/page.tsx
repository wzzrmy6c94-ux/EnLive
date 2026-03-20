"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/enlive-shell";

type UserRole = "venue" | "artist";

type FormState = {
  name: string;
  email: string;
  role: UserRole;
  location: string;
  venue: {
    capacity: string;
    bookingOpen: boolean;
    wheelchairAccess: boolean;
  };
  artist: {
    genre: string;
    showcaseEnabled: boolean;
    socialLinks: boolean;
  };
};

const initialForm: FormState = {
  name: "",
  email: "",
  role: "venue",
  location: "",
  venue: { capacity: "", bookingOpen: true, wheelchairAccess: false },
  artist: { genre: "", showcaseEnabled: true, socialLinks: false },
};

export default function AdminAddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const settingsPreview = useMemo(() => {
    return form.role === "venue"
      ? {
          capacity: form.venue.capacity ? Number(form.venue.capacity) : null,
          bookingOpen: form.venue.bookingOpen,
          wheelchairAccess: form.venue.wheelchairAccess,
        }
      : {
          genre: form.artist.genre || "Unknown",
          showcaseEnabled: form.artist.showcaseEnabled,
          socialLinks: form.artist.socialLinks,
        };
  }, [form]);

  return (
    <main className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center py-8">
      <section className="mb-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Add user</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Create a venue or artist profile. The system will generate the EnLive
          Unique ID in the format{" "}
          <span className="font-medium text-[var(--foreground)]">A123456</span>{" "}
          or
          <span className="font-medium text-[var(--foreground)]">V123456</span>.
        </p>
      </section>

      <Panel className="w-full max-w-3xl shadow-[0_18px_60px_var(--shadow)]">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            void fetch("/api/admin/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                email: form.email,
                role: form.role,
                location: form.location,
                settings: settingsPreview,
              }),
            })
              .then(async (res) => {
                const data = (await res.json()) as {
                  error?: string;
                  user?: { name: string };
                };
                if (!res.ok || !data.user)
                  throw new Error(data.error || "Failed to create user");
                router.push("/admin/users");
              })
              .catch((err: unknown) =>
                setError(
                  err instanceof Error ? err.message : "Failed to create user",
                ),
              )
              .finally(() => setSubmitting(false));
          }}
        >
          <fieldset
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-muted)",
            }}
          >
            <legend className="px-1 text-sm font-semibold text-[var(--foreground)]">
              Account Type
            </legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  form.role === "venue"
                    ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  borderColor:
                    form.role === "venue" ? "var(--primary)" : "var(--border)",
                  background: "var(--surface-elevated)",
                }}
              >
                <input
                  type="radio"
                  name="account-type"
                  value="venue"
                  checked={form.role === "venue"}
                  onChange={() => setForm((p) => ({ ...p, role: "venue" }))}
                  className="sr-only"
                />
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--primary)" }}
                  aria-hidden="true"
                >
                  {form.role === "venue" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  ) : null}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Venue
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  form.role === "artist"
                    ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  borderColor:
                    form.role === "artist" ? "var(--primary)" : "var(--border)",
                  background: "var(--surface-elevated)",
                }}
              >
                <input
                  type="radio"
                  name="account-type"
                  value="artist"
                  checked={form.role === "artist"}
                  onChange={() => setForm((p) => ({ ...p, role: "artist" }))}
                  className="sr-only"
                />
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--primary)" }}
                  aria-hidden="true"
                >
                  {form.role === "artist" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  ) : null}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Artist
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--text-muted)]">Name</span>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-elevated)",
                  color: "var(--foreground)",
                }}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--text-muted)]">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-elevated)",
                  color: "var(--foreground)",
                }}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm md:max-w-md">
            <span className="text-[var(--text-muted)]">Town</span>
            <input
              value={form.location}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              className="rounded-xl border px-3 py-2 outline-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-elevated)",
                color: "var(--foreground)",
              }}
            />
          </label>

          {form.role === "venue" ? (
            <div
              className="grid gap-3 rounded-2xl border p-4"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-muted)",
              }}
            >
              <h2 className="text-sm font-semibold">Venue settings</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Capacity</span>
                  <input
                    type="number"
                    min="0"
                    value={form.venue.capacity}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        venue: { ...p.venue, capacity: e.target.value },
                      }))
                    }
                    className="rounded-xl border px-3 py-2 outline-none"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-elevated)",
                      color: "var(--foreground)",
                    }}
                  />
                </label>
                <label
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.venue.bookingOpen}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        venue: { ...p.venue, bookingOpen: e.target.checked },
                      }))
                    }
                  />
                  Booking open
                </label>
                <label
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.venue.wheelchairAccess}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        venue: {
                          ...p.venue,
                          wheelchairAccess: e.target.checked,
                        },
                      }))
                    }
                  />
                  Wheelchair access
                </label>
              </div>
            </div>
          ) : (
            <div
              className="grid gap-3 rounded-2xl border p-4"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-muted)",
              }}
            >
              <h2 className="text-sm font-semibold">Artist settings</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Genre</span>
                  <input
                    value={form.artist.genre}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        artist: { ...p.artist, genre: e.target.value },
                      }))
                    }
                    className="rounded-xl border px-3 py-2 outline-none"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-elevated)",
                      color: "var(--foreground)",
                    }}
                  />
                </label>
                <label
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.artist.showcaseEnabled}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        artist: {
                          ...p.artist,
                          showcaseEnabled: e.target.checked,
                        },
                      }))
                    }
                  />
                  Showcase enabled
                </label>
                <label
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.artist.socialLinks}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        artist: { ...p.artist, socialLinks: e.target.checked },
                      }))
                    }
                  />
                  Social links
                </label>
              </div>
            </div>
          )}

          {error ? (
            <p className="text-sm text-[var(--primary)]">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: "var(--primary)",
                color: "var(--button-text)",
              }}
            >
              {submitting ? "Creating…" : "Create user"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/users")}
              className="rounded-full border px-4 py-2 text-sm font-medium transition"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Panel>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import ToS from "@/app/docs/ToS";

const COL_COUNT = 40;
const DOT_COUNT = 44;

function EqualizerBackground() {
  return (
    <>
      <style>{`
        @keyframes eq1 {
          0%,100% { transform: scaleY(0.12) }
          25%      { transform: scaleY(0.58) }
          50%      { transform: scaleY(0.28) }
          75%      { transform: scaleY(0.72) }
        }
        @keyframes eq2 {
          0%,100% { transform: scaleY(0.48) }
          30%      { transform: scaleY(0.14) }
          60%      { transform: scaleY(0.76) }
          80%      { transform: scaleY(0.34) }
        }
        @keyframes eq3 {
          0%,100% { transform: scaleY(0.62) }
          20%      { transform: scaleY(0.20) }
          50%      { transform: scaleY(0.78) }
          70%      { transform: scaleY(0.40) }
        }
        @keyframes eq4 {
          0%,100% { transform: scaleY(0.32) }
          35%      { transform: scaleY(0.68) }
          65%      { transform: scaleY(0.16) }
          85%      { transform: scaleY(0.54) }
        }
        @keyframes eq5 {
          0%,100% { transform: scaleY(0.52) }
          15%      { transform: scaleY(0.80) }
          45%      { transform: scaleY(0.20) }
          75%      { transform: scaleY(0.64) }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.28,
          maskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
        }}
      >
        {Array.from({ length: COL_COUNT }).map((_, i) => {
          const variant = (i % 5) + 1;
          const duration = 1.6 + (i % 7) * 0.28;
          const delay = -((i * 0.19) % 2.4);
          return (
            <div
              key={i}
              style={{
                flex: "1 1 0",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "center",
                  gap: "4px",
                  paddingBottom: "8px",
                  transformOrigin: "bottom center",
                  animationName: `eq${variant}`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                }}
              >
                {Array.from({ length: DOT_COUNT }).map((_, d) => (
                  <div
                    key={d}
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function RegisterForm({
  recaptchaSiteKey,
}: {
  recaptchaSiteKey: string;
}) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <RegisterFormInner />
    </GoogleReCaptchaProvider>
  );
}

function RegisterFormInner() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [role, setRole] = useState<"venue" | "artist">("venue");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [genre, setGenre] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => acceptedTerms && !submitting,
    [acceptedTerms, submitting],
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        position: "relative",
        background:
          "radial-gradient(circle at top, var(--hero-glow), transparent 28%), linear-gradient(180deg, var(--shell-from), var(--shell-mid) 48%, var(--shell-to))",
      }}
    >
      <EqualizerBackground />
      <div
        className="w-full max-w-3xl rounded-3xl border p-8 shadow-[0_30px_90px_var(--shadow)] backdrop-blur"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
        }}
      >
        <h1 className="pb-3 text-xl font-semibold tracking-tight text-[var(--foreground)] text-center">
          Create account
        </h1>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!acceptedTerms) {
              setError("Please accept the terms of service.");
              return;
            }
            if (!executeRecaptcha) {
              setError("Verification is not ready yet. Please try again.");
              return;
            }
            setError(null);
            setSubmitting(true);
            try {
              const recaptchaToken = await executeRecaptcha(
                role === "venue" ? "register_venue" : "register_artist",
              );
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  email,
                  password,
                  role,
                  location: address,
                  genre: role === "artist" ? genre || undefined : undefined,
                  recaptchaToken,
                }),
              });
              const data = (await res.json()) as {
                ok?: boolean;
                error?: string;
              };
              if (!res.ok)
                throw new Error(data.error || "Registration failed.");
              router.push("/users/auth/login?registered=1");
            } catch (err: unknown) {
              setError(
                err instanceof Error ? err.message : "Registration failed.",
              );
            } finally {
              setSubmitting(false);
            }
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
                  role === "venue"
                    ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  borderColor:
                    role === "venue" ? "var(--primary)" : "var(--border)",
                  background: "var(--surface-elevated)",
                }}
              >
                <input
                  type="radio"
                  name="account-type"
                  value="venue"
                  checked={role === "venue"}
                  onChange={() => setRole("venue")}
                  className="sr-only"
                />
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--primary)" }}
                  aria-hidden="true"
                >
                  {role === "venue" ? (
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
                  role === "artist"
                    ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  borderColor:
                    role === "artist" ? "var(--primary)" : "var(--border)",
                  background: "var(--surface-elevated)",
                }}
              >
                <input
                  type="radio"
                  name="account-type"
                  value="artist"
                  checked={role === "artist"}
                  onChange={() => setRole("artist")}
                  className="sr-only"
                />
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--primary)" }}
                  aria-hidden="true"
                >
                  {role === "artist" ? (
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
            <Field
              label={role === "venue" ? "Name" : "Stage Name"}
              htmlFor="name"
            >
              <input
                id="name"
                type="text"
                placeholder={
                  role === "venue" ? "The Crown Social" : "Neon Harbor"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-elevated)",
                  color: "var(--foreground)",
                }}
              />
            </Field>

            {role === "artist" ? (
              <Field label="Genre" htmlFor="genre">
                <select
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none cursor-pointer transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                >
                  <option value="">Select a genre</option>
                  {[
                    "Alternative",
                    "Americana",
                    "Blues",
                    "Classical",
                    "Country",
                    "Dream Pop",
                    "Electronic",
                    "Folk",
                    "Funk",
                    "House",
                    "Indie Rock",
                    "Jazz Fusion",
                    "Psych Rock",
                    "R&B",
                    "Soul",
                    "Surf Rock",
                    "Synthpop",
                    "Other",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Address" htmlFor="address">
                <input
                  id="address"
                  type="text"
                  placeholder="12 Market Street, Manchester"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                />
              </Field>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Email" htmlFor="email">
              {role === "venue" ? (
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                />
              ) : (
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                />
              )}
            </Field>
            {role === "venue" ? (
              <Field label="Password" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                />
              </Field>
            ) : (
              <Field label="Password" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-elevated)",
                    color: "var(--foreground)",
                  }}
                />
              </Field>
            )}
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-muted)",
            }}
          >
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="text-[var(--primary)] underline underline-offset-2"
                >
                  terms of service
                </button>
              </span>
            </label>
          </div>

          {error ? (
            <p className="text-sm text-[var(--primary)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--button-text)",
            }}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link
            href="/users/auth/login"
            className="text-[var(--primary)] hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>

      {termsOpen ? <TermsModal onClose={() => setTermsOpen(false)} /> : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <div className="mb-1.5 text-[var(--text-muted)]">{label}</div>
      {children}
    </label>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        className="max-h-[85vh] w-full max-w-4xl rounded-3xl border bg-[var(--surface)] shadow-[0_30px_90px_var(--shadow)]"
        style={{ borderColor: "var(--border)", overflow: "clip" }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              EnLive — Terms of Service
            </h2>
            <div className="mt-1 flex flex-nowrap gap-x-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
              <span>Effective: 1 January 2025</span>
              <span>·</span>
              <span>Last updated: January 2025</span>
              <span>·</span>
              <span>Governing law: England &amp; Wales</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Close
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className="max-h-[calc(85vh-64px)] overflow-auto px-6 py-5 text-sm leading-6 text-[var(--foreground)]"
        >
          <ToS inModal scrollContainerRef={scrollContainerRef} />
        </div>
      </div>
    </div>
  );
}

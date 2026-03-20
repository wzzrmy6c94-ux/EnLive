"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "@/components/nav-link";
import EnliveLogoRed from "@/app/assets/enlive-logo-red.png";

export function UserHeader({
  title,
  subtitle,
  headerMode = "private",
  hideHeroHeader = false,
}: {
  title: string;
  subtitle?: string;
  headerMode?: "public" | "private";
  hideHeroHeader?: boolean;
}) {
  const router = useRouter();
  const [sessionLabel, setSessionLabel] = useState<string>("Guest");
  const [sessionName, setSessionName] = useState<string>("Guest");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { user: { id: string; name: string; role: string } | null }) => {
        if (cancelled) return;
        setSessionLabel(
          data.user ? `${data.user.name} (${data.user.role})` : "Guest",
        );
        setSessionName(data.user?.name ?? "Guest");
        setSessionUserId(data.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionLabel("Guest");
          setSessionName("Guest");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header
      className={`${hideHeroHeader ? "mb-4" : "mb-6"} relative z-40 overflow-visible rounded-3xl border p-4 shadow-[0_10px_40px_var(--shadow)] backdrop-blur sm:p-5`}
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {!hideHeroHeader ? (
          <div>
            <Image src={EnliveLogoRed} alt="Enlive" height={32} width={120} className="h-8 w-auto object-contain" />
          </div>
        ) : (
          <>
            <Image src={EnliveLogoRed} alt="Enlive" height={32} width={120} className="h-8 w-auto object-contain" />
          </>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {headerMode === "public" ? (
            <>
              <NavLink href="/">Leaderboard</NavLink>
              <NavLink href="/users/auth/login">Login</NavLink>
            </>
          ) : (
            <>
              {sessionUserId && (
                <Link
                  href={`/target/${sessionUserId}`}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-80"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-current" style={{ color: "var(--icon-accent)" }}>
                    <path d="M10 10a3.25 3.25 0 1 0-3.25-3.25A3.25 3.25 0 0 0 10 10Zm0 1.5c-3 0-5.5 1.63-5.5 3.75V16h11v-.75c0-2.12-2.5-3.75-5.5-3.75Z" />
                  </svg>
                  Profile
                </Link>
              )}
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border px-2 py-1 transition"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-muted)",
                      color: "var(--icon-accent)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 fill-current"
                    >
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
                    </svg>
                  </div>
                  <span
                    className="max-w-[140px] truncate text-xs text-[var(--foreground)]"
                    title={sessionLabel}
                  >
                    {sessionName}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`h-3 w-3 transition ${accountOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--icon-accent)" }}
                  >
                    <path fill="currentColor" d="M5.5 7.5 10 12l4.5-4.5" />
                  </svg>
                </button>

                {accountOpen ? (
                  <div
                    className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-xl border p-1.5 shadow-[0_18px_40px_var(--shadow)]"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-strong)",
                    }}
                  >
                    <Link
                      href={sessionUserId ? `/target/${sessionUserId}` : "#"}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 fill-current text-[var(--text-muted)]"
                      >
                        <path d="M10 10a3.25 3.25 0 1 0-3.25-3.25A3.25 3.25 0 0 0 10 10Zm0 1.5c-3 0-5.5 1.63-5.5 3.75V16h11v-.75c0-2.12-2.5-3.75-5.5-3.75Z" />
                      </svg>
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        setSessionLabel("Guest");
                        setSessionName("Guest");
                        setAccountOpen(false);
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 fill-current text-[var(--text-muted)]"
                      >
                        <path d="M8.5 3.5a.75.75 0 0 1 0 1.5H5.75v10H8.5a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75V4.25A.75.75 0 0 1 5 3.5Zm4.72 2.22a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H8a.75.75 0 0 1 0-1.5h7.69l-2.47-2.47a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EnliveLogoLight from "@/app/assets/enlive-logo-light.png";
import EnliveLogoDark from "@/app/assets/enlive-logo-dark.png";

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === "/admin/auth/login") return null;
  const [sessionName, setSessionName] = useState("Admin");
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { user: { name: string } | null }) => {
        setSessionName(data.user?.name ?? "Admin");
      })
      .catch(() => setSessionName("Admin"));
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header
      className="mb-6 overflow-visible rounded-3xl border p-4 shadow-[0_10px_40px_var(--shadow)] backdrop-blur sm:p-5"
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image src={EnliveLogoLight} alt="Enlive" height={32} width={120} className="h-8 w-auto object-contain dark:hidden" />
          <Image src={EnliveLogoDark} alt="Enlive" height={32} width={120} className="hidden h-8 w-auto object-contain dark:block" />
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin/users"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              pathname === "/admin/users" ? "opacity-100" : "opacity-80 hover:opacity-100"
            }`}
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            Users
          </Link>

          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border px-2 py-1 transition"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span className="max-w-[140px] truncate text-xs">{sessionName}</span>
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
                style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    setAccountOpen(false);
                    router.push("/admin/auth/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

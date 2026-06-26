"use client";

import Link from "next/link";

export function ContributorsButton() {
  return (
    <Link
      href="/contributors"
      aria-label="View contributors"
      title="Contributors"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+8.8rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur transition hover:scale-[1.04] sm:right-6"
      style={{
        borderColor: "var(--border-strong)",
        background: "linear-gradient(180deg, var(--surface-strong), var(--surface))",
        color: "var(--icon-accent)",
        boxShadow: "0 14px 34px var(--shadow)",
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M16.75 19.25v-1.1c0-1.95-1.6-3.55-3.55-3.55H7.55C5.6 14.6 4 16.2 4 18.15v1.1" />
        <path d="M10.35 11.4a3.35 3.35 0 1 0 0-6.7 3.35 3.35 0 0 0 0 6.7Z" />
        <path d="M20 19.25v-.85c0-1.55-1.04-2.88-2.5-3.28" />
        <path d="M15.65 4.92a3.05 3.05 0 0 1 0 5.96" />
      </svg>
    </Link>
  );
}

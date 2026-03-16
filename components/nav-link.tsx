"use client";

import Link from "next/link";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      {children}
    </Link>
  );
}

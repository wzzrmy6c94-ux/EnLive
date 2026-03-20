"use client";

import { UserHeader } from "@/app/users/components/userheader";

export function EnliveShell({
  children,
  title,
  subtitle,
  headerMode = "private",
  hideHeroHeader = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerMode?: "public" | "private";
  hideHeroHeader?: boolean;
}) {

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--hero-glow),transparent_28%),linear-gradient(180deg,var(--shell-from),var(--shell-mid)_48%,var(--shell-to))] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <UserHeader
          title={title}
          subtitle={subtitle}
          headerMode={headerMode}
          hideHeroHeader={hideHeroHeader}
        />
        {children}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 backdrop-blur ${className}`}
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, white 12%), var(--surface))",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

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
    <div className="enlive-shell min-h-screen text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-3 sm:px-6 sm:pt-5 lg:px-8">
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
      className={`rounded-xl border p-4 sm:p-5 ${className}`}
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

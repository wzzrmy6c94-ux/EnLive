import type { Metadata } from "next";
import { AdminHeader } from "@/app/admin/components/adminheader";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin",
  ...noIndexMetadata,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--hero-glow),transparent_28%),linear-gradient(180deg,var(--shell-from),var(--shell-mid)_48%,var(--shell-to))] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-28 pt-4 sm:px-6 sm:py-6 sm:pb-32 lg:px-8">
        <AdminHeader />
        {children}
      </div>
    </div>
  );
}

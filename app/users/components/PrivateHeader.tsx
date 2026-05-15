// app/users/components/PrivateHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PrivateHeaderProps {
  title?: string;
  subtitle?: string;
  hideHeroHeader?: boolean;
}

export function PrivateHeader({ 
  title, 
  subtitle, 
  hideHeroHeader = false 
}: PrivateHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Events", href: "/my-events" },
    { label: "Saved", href: "/saved" },
    { label: "Settings", href: "/settings" },
  ];

  // If hideHeroHeader is true, just show the navigation bar
  if (hideHeroHeader) {
    return (
      <header className="relative z-10 w-full">
        <div className="mx-auto flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            placeholder
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:opacity-70 ${
                  pathname === item.href ? "opacity-100" : "opacity-70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User avatar/menu - placeholder for now */}
          <div className="h-8 w-8 rounded-full bg-white/10" />
        </div>
      </header>
    );
  }

  // Full hero header mode (your existing design)
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 opacity-70">{subtitle}</p>}
    </div>
  );
}
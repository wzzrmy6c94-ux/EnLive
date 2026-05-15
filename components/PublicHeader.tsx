// app/components/PublicHeader.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

interface PublicHeaderProps {
  headerMode?: "public" | "private";
}

export function PublicHeader({ headerMode = "public" }: PublicHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with your auth state

  const navItems = [
    { label: "Artists", href: "/artists" },
    { label: "Venues", href: "/venues" },
    { label: "Cities", href: "/cities" },
  ];

  return (
    <header className="relative z-10 w-full">
      <div className="mx-auto flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight">
          placeholder
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium transition-colors hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-sm font-medium transition-colors hover:opacity-70"
          >
            Leaderboard
          </Link>
          {!isLoggedIn ? (
            <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20">
              Login
            </button>
          ) : (
            // Add user menu here if needed
            <div>User Menu</div>
          )}
        </div>
      </div>
    </header>
  );
}
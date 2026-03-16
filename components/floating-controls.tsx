"use client";

import { usePathname } from "next/navigation";
import { ScrollToTopButton } from "@/components/scroll-to-top";
import { ThemeToggle } from "@/components/theme-toggle";

export function FloatingControls() {
  const pathname = usePathname();
  const showControls = pathname === "/" || pathname === "/leaderboard";

  if (!showControls) {
    return null;
  }

  return (
    <>
      <ScrollToTopButton />
      <ThemeToggle />
    </>
  );
}

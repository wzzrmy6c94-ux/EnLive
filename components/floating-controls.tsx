"use client";

import { ContributorsButton } from "@/components/contributors-button";
import { ScrollToTopButton } from "@/components/scroll-to-top";
import { ThemeToggle } from "@/components/theme-toggle";

export function FloatingControls() {
  return (
    <>
      <ContributorsButton />
      <ScrollToTopButton />
      <ThemeToggle />
    </>
  );
}

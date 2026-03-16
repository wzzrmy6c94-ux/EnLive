"use client";

import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function onScroll() {
      const viewportBottom = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setEnabled(pageHeight - viewportBottom < 160);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (!enabled) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="Scroll to top"
      title="Scroll to top"
      aria-disabled={!enabled}
      className="fixed bottom-[4.9rem] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur transition duration-300"
      style={{
        borderColor: enabled ? "var(--border-strong)" : "var(--border)",
        background: enabled
          ? "linear-gradient(180deg, var(--surface-strong), var(--surface))"
          : "linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, gray 8%), color-mix(in srgb, var(--surface-muted) 88%, gray 12%))",
        color: enabled ? "var(--icon-accent)" : "var(--text-muted)",
        boxShadow: enabled ? "0 14px 34px var(--shadow)" : "0 10px 24px color-mix(in srgb, var(--shadow) 55%, transparent)",
        opacity: enabled ? 1 : 0.68,
        cursor: enabled ? "pointer" : "not-allowed",
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M12 19V5" />
        <path d="m5.75 11.25 6.25-6.25 6.25 6.25" />
      </svg>
    </button>
  );
}

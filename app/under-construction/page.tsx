"use client";
import Image from "next/image";

import EnliveLogoLight from "@/app/assets/enlive-logo-light.png";
import { EqualizerBackground } from "@/components/equalizer-background";

export default function UnderConstructionPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        position: "relative",
        background:
          "radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--primary-light) 42%, transparent), transparent 30%), radial-gradient(circle at 82% 10%, color-mix(in srgb, var(--hero-glow) 80%, transparent), transparent 28%), linear-gradient(180deg, var(--hero-from), var(--hero-via) 46%, var(--hero-to))",
      }}
    >
      <EqualizerBackground />
      <div
        className="w-full max-w-sm rounded-3xl border p-10 shadow-[0_30px_90px_var(--shadow)] backdrop-blur text-center"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border-strong)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 88%, white 12%), var(--surface))",
        }}
      >
        <div className="mx-auto mb-6 flex items-center justify-center">
          <Image
            src={EnliveLogoLight}
            alt="EnLive"
            width={120}
            height={40}
            priority
          />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-strong)]">
          Under Construction
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          This site is still being built. Check back soon — something great is
          on its way.
        </p>

        <div
          className="mt-8 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--surface-muted)" }}
        >
          <div
            className="h-full w-2/3 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--primary-deep), var(--primary))",
            }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--text-sub)]">
          Work in progress
        </p>
      </div>
    </div>
  );
}

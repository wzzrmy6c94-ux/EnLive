"use client";

import React from "react";

const COL_COUNT = 72;

export function EqualizerBackground() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.14,
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        {Array.from({ length: COL_COUNT }).map((_, i) => {
          // Waveform envelope: taller in the middle
          const distFromCenter = Math.abs(i - (COL_COUNT - 1) / 2) / ((COL_COUNT - 1) / 2);
          const envelope = 0.05 + Math.pow(1 - distFromCenter, 0.8) * 0.95;

          return (
            <div
              key={i}
              style={{
                flex: "1 1 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                opacity: 0.3 + (1 - distFromCenter) * 0.7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  transformOrigin: "center center",
                  transform: `scaleY(${envelope})`, // Static envelope
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1.5px",
                    transformOrigin: "center center",
                  animation: "enlive-equalizer 8s ease-in-out infinite",
                  animationDelay: `${-((i * 0.17) % 2.4)}s`,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: "infinite",
                  }}
                >
                  {Array.from({ length: 36 }).map((_, d) => (
                    <div
                      key={d}
                      style={{
                        width: "1px",
                        height: "1px",
                        borderRadius: "1px",
                        background: "var(--primary)",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

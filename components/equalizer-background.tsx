"use client";

import React from "react";

const COL_COUNT = 200;
const DOT_COUNT = 100;

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
      <style>{`
        @keyframes eq1 {
          0%,100% { transform: scaleY(0.12) }
          25%      { transform: scaleY(0.58) }
          50%      { transform: scaleY(0.28) }
          75%      { transform: scaleY(0.72) }
        }
        @keyframes eq2 {
          0%,100% { transform: scaleY(0.48) }
          30%      { transform: scaleY(0.14) }
          60%      { transform: scaleY(0.76) }
          80%      { transform: scaleY(0.34) }
        }
        @keyframes eq3 {
          0%,100% { transform: scaleY(0.62) }
          20%      { transform: scaleY(0.20) }
          50%      { transform: scaleY(0.78) }
          70%      { transform: scaleY(0.40) }
        }
        @keyframes eq4 {
          0%,100% { transform: scaleY(0.32) }
          35%      { transform: scaleY(0.68) }
          65%      { transform: scaleY(0.16) }
          85%      { transform: scaleY(0.54) }
        }
        @keyframes eq5 {
          0%,100% { transform: scaleY(0.52) }
          15%      { transform: scaleY(0.80) }
          45%      { transform: scaleY(0.20) }
          75%      { transform: scaleY(0.64) }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.4,
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        {Array.from({ length: COL_COUNT }).map((_, i) => {
          const variant = (i % 5) + 1;
          const duration = 1.4 + (i % 7) * 0.25;
          const delay = -((i * 0.17) % 2.4);
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
                opacity: 0.4 + (1 - distFromCenter) * 0.6, // Broaden visible width
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1.5px",
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
                    animationName: `eq${variant}`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: "infinite",
                  }}
                >
                  {Array.from({ length: DOT_COUNT }).map((_, d) => (
                    <div
                      key={d}
                      style={{
                        width: "2px",
                        height: "2px",
                        borderRadius: "50%",
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

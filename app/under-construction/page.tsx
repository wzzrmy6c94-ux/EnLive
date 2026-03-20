"use client";

const COL_COUNT = 40;
const DOT_COUNT = 44;

function EqualizerBackground() {
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
          alignItems: "flex-end",
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.28,
          maskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 30%, transparent 62%)",
        }}
      >
        {Array.from({ length: COL_COUNT }).map((_, i) => {
          const variant = (i % 5) + 1;
          const duration = 1.6 + (i % 7) * 0.28;
          const delay = -((i * 0.19) % 2.4);
          return (
            <div
              key={i}
              style={{
                flex: "1 1 0",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "center",
                  gap: "4px",
                  paddingBottom: "8px",
                  transformOrigin: "bottom center",
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
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function UnderConstructionPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        position: "relative",
        background:
          "radial-gradient(circle at top, var(--hero-glow), transparent 28%), linear-gradient(180deg, var(--shell-from), var(--shell-mid) 48%, var(--shell-to))",
      }}
    >
      <EqualizerBackground />
      <div
        className="w-full max-w-sm rounded-3xl border p-10 shadow-[0_30px_90px_var(--shadow)] backdrop-blur text-center"
        style={{
          position: "relative",
          zIndex: 10,
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 86%, white 14%), var(--surface))",
        }}
      >
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{
            background: "var(--surface-muted)",
            color: "var(--primary)",
          }}
        >
          🚧
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
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
                "linear-gradient(90deg, var(--primary), var(--secondary))",
            }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Work in progress
        </p>
      </div>
    </div>
  );
}

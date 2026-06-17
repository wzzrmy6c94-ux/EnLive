"use client";

import { useMemo, useState } from "react";

type QrResult = {
  target: {
    name: string;
    role: "venue" | "artist";
  };
  ratingUrl: string;
  pngDataUrl: string;
  svgDataUrl: string;
};

function fileSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "enlive";
}

export function QrCodeGenerator({ targetId, targetName }: { targetId: string; targetName?: string }) {
  const [qr, setQr] = useState<QrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const downloadName = useMemo(() => {
    return `${fileSlug(qr?.target.name ?? targetName ?? "enlive")}-rating-qr`;
  }, [qr?.target.name, targetName]);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const data = (await res.json()) as Partial<QrResult> & { error?: string };
      if (!res.ok || !data.ratingUrl || !data.pngDataUrl || !data.svgDataUrl || !data.target) {
        throw new Error(data.error || "Failed to generate QR code.");
      }
      setQr(data as QrResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate QR code.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!qr?.ratingUrl) return;
    await navigator.clipboard.writeText(qr.ratingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { void generate(); }}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)", color: "var(--button-text)" }}
        >
          {loading ? "Generating..." : qr ? "Regenerate QR" : "Generate QR"}
        </button>
        {qr ? (
          <button
            type="button"
            onClick={() => { void copyLink(); }}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}

      {qr ? (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <img
            src={qr.pngDataUrl}
            alt={`Rating QR code for ${qr.target.name}`}
            className="h-[180px] w-[180px] rounded-xl border bg-white p-2"
            style={{ borderColor: "var(--border)" }}
          />
          <div className="flex flex-col justify-center gap-3">
            <a
              href={qr.ratingUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-[var(--text-muted)] transition hover:text-[var(--primary)]"
            >
              {qr.ratingUrl}
            </a>
            <div className="flex flex-wrap gap-2">
              <a
                href={qr.pngDataUrl}
                download={`${downloadName}.png`}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Download PNG
              </a>
              <a
                href={qr.svgDataUrl}
                download={`${downloadName}.svg`}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Download SVG
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

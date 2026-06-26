"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char] ?? char;
  });
}

export function QrCodeGenerator({
  targetId,
  targetName,
  autoGenerate = false,
}: {
  targetId: string;
  targetName?: string;
  autoGenerate?: boolean;
}) {
  const [qr, setQr] = useState<QrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const downloadName = useMemo(() => {
    return `${fileSlug(qr?.target.name ?? targetName ?? "enlive")}-rating-qr`;
  }, [qr?.target.name, targetName]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setQr(null);
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
  }, [targetId]);

  useEffect(() => {
    if (!autoGenerate) return;
    void generate();
  }, [autoGenerate, generate]);

  async function copyLink() {
    if (!qr?.ratingUrl) return;
    await navigator.clipboard.writeText(qr.ratingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function printQr() {
    if (!qr) return;

    const printWindow = window.open("", "_blank", "width=640,height=760");
    if (!printWindow) {
      setError("Could not open the print window. Please allow pop-ups for this site and try again.");
      return;
    }

    const name = escapeHtml(qr.target.name);
    const ratingUrl = escapeHtml(qr.ratingUrl);
    const pngDataUrl = escapeHtml(qr.pngDataUrl);
    const title = `${name} EnLive rating QR code`;

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        background: #ffffff;
      }
      .sheet {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        text-align: center;
      }
      h1 {
        margin: 0;
        font-size: 30px;
        line-height: 1.15;
      }
      p {
        margin: 0;
        max-width: 560px;
        color: #374151;
        font-size: 16px;
        line-height: 1.45;
      }
      img {
        width: 320px;
        height: 320px;
        border: 1px solid #d1d5db;
        padding: 12px;
      }
      .url {
        max-width: 560px;
        overflow-wrap: anywhere;
        color: #6b7280;
        font-size: 12px;
      }
      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <p>Scan to rate on EnLive</p>
      <h1>${name}</h1>
      <img src="${pngDataUrl}" alt="EnLive rating QR code for ${name}" onload="setTimeout(function(){ window.focus(); window.print(); }, 200)" />
      <p class="url">${ratingUrl}</p>
    </main>
  </body>
</html>`);
    printWindow.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { void generate(); }}
          disabled={loading}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)", color: "var(--button-text)" }}
        >
          {loading ? "Generating..." : qr ? "Regenerate QR" : "Generate QR"}
        </button>
        {qr ? (
          <button
            type="button"
            onClick={() => { void copyLink(); }}
            className="min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        ) : null}
        {qr ? (
          <button
            type="button"
            onClick={printQr}
            className="min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Print QR
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}

      {qr ? (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <img
            src={qr.pngDataUrl}
            alt={`Rating QR code for ${qr.target.name}`}
            className="mx-auto h-[180px] w-[180px] rounded-xl border bg-white p-2 sm:mx-0"
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
                className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Download PNG
              </a>
              <a
                href={qr.svgDataUrl}
                download={`${downloadName}.svg`}
                className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
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

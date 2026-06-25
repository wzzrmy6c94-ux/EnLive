"use client";

import { QrCodeGenerator } from "@/components/QrCodeGenerator";

type AdminQrTarget = {
  id: string;
  name: string;
  role?: string;
  location?: string;
  emailVerified?: boolean;
};

export function AdminQrModal({
  target,
  onClose,
}: {
  target: AdminQrTarget | null;
  onClose: () => void;
}) {
  if (!target) return null;

  const meta = [target.role, target.location].filter(Boolean).join(" / ");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-qr-title"
    >
      <div
        className="max-h-[calc(100vh-4rem)] w-full max-w-xl overflow-y-auto rounded-2xl border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Printable rating QR</div>
            <h2 id="admin-qr-title" className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {target.name}
            </h2>
            {meta ? <p className="mt-1 text-sm text-[var(--text-muted)]">{meta}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            aria-label="Close QR code panel"
          >
            Close
          </button>
        </div>

        {target.emailVerified === false ? (
          <div
            className="mt-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgb(252 211 77 / 0.35)",
              background: "rgb(252 211 77 / 0.08)",
              color: "rgb(253 230 138)",
            }}
          >
            This QR code can be printed now. The rating form will stay inactive until the profile email is verified.
          </div>
        ) : null}

        <div className="mt-5">
          <QrCodeGenerator targetId={target.id} targetName={target.name} autoGenerate />
        </div>
      </div>
    </div>
  );
}

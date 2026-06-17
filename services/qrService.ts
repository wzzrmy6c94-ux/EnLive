import { withDb } from "@/lib/server/db";
import QRCode from 'qrcode';

function appBaseUrl(appUrl: string) {
  return appUrl.replace(/\/$/, "");
}

export async function generateQrCode(targetId: string, appUrl: string) {
  const target = await withDb(async (db) => {
    const res = await db.query<{
      id: string;
      name: string;
      role: "venue" | "artist";
    }>(
      `SELECT id, name, role
       FROM users
       WHERE id = $1 AND role IN ('venue','artist')
       LIMIT 1`,
      [targetId],
    );
    return res.rows[0] ?? null;
  });

  if (!target) {
    return { ok: false as const, error: "Profile not found." };
  }

  const ratingUrl = `${appBaseUrl(appUrl)}/rate/${encodeURIComponent(target.id)}`;
  const qrOptions = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    width: 768,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };

  const [pngDataUrl, svg] = await Promise.all([
    QRCode.toDataURL(ratingUrl, qrOptions),
    QRCode.toString(ratingUrl, { ...qrOptions, type: "svg" as const }),
  ]);

  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return {
    ok: true as const,
    target,
    ratingUrl,
    pngDataUrl,
    svgDataUrl,
  };
}

import { withDb } from '@/lib/server/db';
import { createQrToken } from '@/lib/qrToken';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';

export async function generateQrCode(targetId: string) {
  const token = createQrToken(targetId);
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 h

  // Insert DB record
  const row = await withDb(async (db) => {
    const res = await db.query(
      `INSERT INTO qr_codes (target_id, token, expires_at, used) VALUES ($1, $2, $3, false) RETURNING id, token`,
      [targetId, token, expiresAt],
    );
    return res.rows[0];
  });

  const imagePath = path.join('public', 'qr', `${row.id}.png`);
  await QRCode.toFile(imagePath, token, { color: { dark: '#000000', light: '#FFFFFF' } });

  return { imagePath, token };
}

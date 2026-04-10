import { NextResponse } from 'next/server';
import { withDb } from '@/lib/server/db';
import { verifyQrToken } from '@/lib/qrToken';

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });
  try {
    verifyQrToken(token); // throws if invalid/expired
    await withDb(async (db) => {
      await db.query('UPDATE qr_codes SET used = true WHERE token = $1', [token]);
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

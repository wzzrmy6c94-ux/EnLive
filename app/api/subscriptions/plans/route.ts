import { NextResponse } from 'next/server';
import { withDb } from '@/lib/server/db';

export async function GET() {
  const plans = await withDb(async (db) => {
    const res = await db.query(`SELECT * FROM subscription_plans`);
    return res.rows;
  });
  return NextResponse.json(plans);
}

import { NextRequest } from 'next/server';
import { ok, withApi } from '@/lib/server/api';
import { withDb } from '@/lib/server/db';

export const runtime = 'nodejs';

export const GET = withApi(async (_request: NextRequest, { requestId }) => {
  const plans = await withDb(async (db) => {
    const res = await db.query(`
      SELECT id, name, role, price_monthly_cents, discount_percent
      FROM subscription_plans
      ORDER BY role ASC, price_monthly_cents ASC
    `);
    return res.rows;
  });
  return ok(requestId, plans);
});

import { createSquareClient } from '@/lib/squareClient';
import { withDb } from '@/lib/server/db';

export async function createSubscription(userId: string, planId: string, interval: 'monthly' | 'yearly') {
  const client = createSquareClient();

  const plan = await withDb(async (db) => {
    const res = await db.query<{ id: number; price_monthly_cents: number; discount_percent: number }>(
      `SELECT id, price_monthly_cents, discount_percent FROM subscription_plans WHERE id = $1`,
      [Number(planId)],
    );
    return res.rows[0] ?? null;
  });
  if (!plan) throw new Error('Plan not found');

  const user = await withDb(async (db) => {
    const res = await db.query<{ id: string; square_customer_id: string | null }>(
      `SELECT id, square_customer_id FROM users WHERE id = $1`,
      [userId],
    );
    return res.rows[0] ?? null;
  });
  if (!user) throw new Error('User not found');
  if (!user.square_customer_id) throw new Error('Square customer not linked');

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) throw new Error('SQUARE_LOCATION_ID not set');

  const body = {
    locationId,
    planVariationId: `plan_${plan.id}`,
    customerId: user.square_customer_id,
  };

  const subscription = await client.subscriptions.create(body);
  await withDb(async (db) => {
    await db.query(
      `UPDATE users SET square_subscription_id = $1 WHERE id = $2`,
      [subscription.subscription?.id, userId],
    );
  });
  return subscription.subscription;
}

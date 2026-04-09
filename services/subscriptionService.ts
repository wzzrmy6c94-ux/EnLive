import { createSquareClient } from '@/lib/squareClient';
import prisma from '@/lib/prisma'; // Assuming prisma client exported here

export async function createSubscription(userId: string, planId: string, interval: 'monthly' | 'yearly') {
  const client = createSquareClient();
  const plan = await prisma.subscription_plans.findUnique({ where: { id: Number(planId) } });
  if (!plan) throw new Error('Plan not found');

  const priceCents = interval === 'monthly' ? plan.price_monthly_cents : Math.round(plan.price_monthly_cents * 12 * (1 - plan.discount_percent / 100));

  // For simplicity, assume customerId is stored on user record
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (!user.square_customer_id) throw new Error('Square customer not linked');

  const body = {
    locationId: process.env.SQUARE_LOCATION_ID,
    planId: `plan_${plan.id}`,
    customerId: user.square_customer_id,
    // Note: price is handled by plan pricing in Square console; we include for completeness
  } as any;

  const subscription = await client.subscriptionsApi.createSubscription(body);
  await prisma.users.update({ where: { id: userId }, data: { square_subscription_id: subscription.result.subscription.id } });
  return subscription.result.subscription;
}

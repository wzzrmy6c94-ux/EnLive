import { NextResponse } from 'next/server';
import { createSubscription } from '@/services/subscriptionService';
import { z } from 'zod';

const schema = z.object({
  userId: z.string(),
  planId: z.number(),
  interval: z.enum(['monthly', 'yearly']),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { userId, planId, interval } = parsed.data;
  const sub = await createSubscription(userId, String(planId), interval);
  return NextResponse.json({ subscriptionId: sub?.id });
}

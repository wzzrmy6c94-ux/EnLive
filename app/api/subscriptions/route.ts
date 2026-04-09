import { NextResponse } from 'next/server';
import { createSubscription } from '@/services/subscriptionService';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  planId: z.number(),
  interval: z.enum(['monthly', 'yearly']),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { planId, interval } = parsed.data;
  const sub = await createSubscription(user.id, String(planId), interval);
  return NextResponse.json({ subscriptionId: sub.id });
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  const signature = req.headers.get('Square-Signature') || '';
  const body = await req.text();
  const secret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
  const hmac = crypto.createHmac('sha1', secret).update(body).digest('base64');
  if (hmac !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  const event = JSON.parse(body);
  if (event.type === 'subscription.created' || event.type === 'subscription.updated') {
    const sub = event.data.object.subscription;
    await prisma.users.updateMany({ where: { square_subscription_id: sub.id }, data: { square_customer_id: sub.customerId } });
  }
  // TODO: handle payment.failed, subscription.canceled
  return NextResponse.json({ success: true });
}

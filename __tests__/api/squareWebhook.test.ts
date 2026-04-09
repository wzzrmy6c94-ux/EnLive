import crypto from 'crypto';

import handler from '@/app/api/square/webhook/route';

jest.mock('@/lib/prisma', () => ({
  users: {
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
}));

process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = 'secret-key';

const validSignature = crypto.createHmac('sha1', 'secret-key').update(JSON.stringify({ type: 'subscription.created', data: { object: { subscription: { id: 'sub_123', customerId: 'cust_456' } } })).digest('base64');

test('handles subscription.created webhook', async () => {
  const payload = { type: 'subscription.created', data: { object: { subscription: { id: 'sub_123', customerId: 'cust_456' } } } };
  const res = await request(handler).post('/api/square/webhook').set('Square-Signature', validSignature).send(payload);
  expect(res.status).toBe(200);
});

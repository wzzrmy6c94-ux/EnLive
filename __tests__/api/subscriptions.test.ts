import request from 'supertest';
import handler from '@/app/api/subscriptions/route';

jest.mock('@/services/subscriptionService', () => ({
  createSubscription: jest.fn().mockResolvedValue({ id: 'sub_123' }),
}));

jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
}));

test('POST /api/subscriptions returns 200 with subscription ID', async () => {
  const res = await request(handler).post('/api/subscriptions').send({ planId: 1, interval: 'monthly' });
  expect(res.status).toBe(200);
  expect(res.body.subscriptionId).toBeDefined();
});

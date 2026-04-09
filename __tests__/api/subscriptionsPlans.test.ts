import request from 'supertest';
import handler from '@/app/api/subscriptions/plans/route';

jest.mock('@/lib/prisma', () => ({
  subscription_plans: { findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Artist', role: 'artist', price_monthly_cents: 1000, discount_percent: 10 }]) },
}));

test('GET /api/subscriptions/plans returns plans', async () => {
  const res = await request(handler).get('/api/subscriptions/plans');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
});

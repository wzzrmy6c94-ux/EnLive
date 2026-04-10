import request from 'supertest';
import handler from '@/app/api/users/profile/route';

jest.mock('@/lib/server/db', () => ({
  getUserById: jest.fn().mockResolvedValue({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'artist',
    location: 'Town',
    createdAt: '2026-01-01T00:00:00Z',
    square_subscription_id: 'sub-123',
  }),
}));

jest.mock('@/lib/server/auth', () => ({
  getSessionFromRequest: jest.fn().mockReturnValue({ userId: 'user-1' }),
}));

test('GET profile includes subscriptionId', async () => {
  const res = await request(handler).get('/api/users/profile');
  expect(res.status).toBe(200);
  expect(res.body.user.subscriptionId).toBe('sub-123');
});

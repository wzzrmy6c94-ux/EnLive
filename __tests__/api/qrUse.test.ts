import request from 'supertest';
import handler from '@/app/api/qr/use/route';

jest.mock('@/lib/qrToken', () => ({
  verifyQrToken: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@/lib/server/db', () => ({
  withDb: jest.fn().mockImplementation(async (fn) => fn({ query: jest.fn().mockResolvedValue({}) })),
}));

test('POST /api/qr/use marks token used', async () => {
  const res = await request(handler).post('/api/qr/use').send({ token: 'signed-token' });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});

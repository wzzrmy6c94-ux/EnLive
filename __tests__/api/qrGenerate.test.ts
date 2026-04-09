import request from 'supertest';
import handler from '@/app/api/qr/generate/route';

jest.mock('@/services/qrService');

(test as any)('POST /api/qr/generate returns image URL and token', async () => {
  (generateQrCode as jest.Mock).mockResolvedValue({ imagePath: 'public/qr/uuid.png', token: 'signed-token' });
  const res = await request(handler).post('/api/qr/generate').send({ targetId: 'target-123' });
  expect(res.status).toBe(200);
  expect(res.body.imageUrl).toContain('/qr/uuid.png');
  expect(res.body.token).toBe('signed-token');
});

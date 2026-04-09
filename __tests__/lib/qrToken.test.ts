import { createQrToken, verifyQrToken } from '@/lib/qrToken';

test('create and verify QR token', () => {
  process.env.QR_TOKEN_SECRET = 'test-secret';
  const token = createQrToken('target-123');
  const payload = verifyQrToken(token);
  expect(payload.targetId).toBe('target-123');
});

import { POST } from '@/app/api/qr/generate/route';
import { getSessionFromRequest } from '@/lib/server/auth';
import { generateQrCode } from '@/services/qrService';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/server/auth');
jest.mock('@/services/qrService');

(test as any)('generates a QR code for the signed-in owner', async () => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://enlive.app';
  (getSessionFromRequest as jest.Mock).mockReturnValue({ userId: 'target-123', role: 'venue' });
  (generateQrCode as jest.Mock).mockResolvedValue({
    ok: true,
    target: { id: 'target-123', name: 'Test Venue', role: 'venue' },
    ratingUrl: 'https://enlive.app/rate/target-123',
    pngDataUrl: 'data:image/png;base64,abc123',
    svgDataUrl: 'data:image/svg+xml;base64,def456',
  });

  const req = new Request('https://enlive.app/api/qr/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: 'target-123' }),
  }) as NextRequest;

  const res = await POST(req);
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toMatchObject({
    ratingUrl: 'https://enlive.app/rate/target-123',
    pngDataUrl: 'data:image/png;base64,abc123',
  });
});

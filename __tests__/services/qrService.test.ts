import { generateQrCode } from '@/services/qrService';
import { withDb } from '@/lib/server/db';
import QRCode from 'qrcode';

jest.mock('@/lib/server/db');
jest.mock('qrcode');

const mockQuery = jest.fn().mockResolvedValue({
  rows: [{ id: 'target-123', name: 'Test Venue', role: 'venue' }],
});
(withDb as jest.Mock).mockImplementation(async (fn) => fn({ query: mockQuery } as any));
(QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,abc123');
(QRCode.toString as jest.Mock).mockResolvedValue('<svg />');

test('generateQrCode creates downloadable data URLs for the rating page', async () => {
  const result = await generateQrCode('target-123', 'https://enlive.app');
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);

  expect(result.ratingUrl).toBe('https://enlive.app/rate/target-123');
  expect(result.pngDataUrl).toBe('data:image/png;base64,abc123');
  expect(result.svgDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  expect(QRCode.toDataURL).toHaveBeenCalledWith('https://enlive.app/rate/target-123', expect.any(Object));
  expect(QRCode.toString).toHaveBeenCalledWith('https://enlive.app/rate/target-123', expect.objectContaining({ type: 'svg' }));
});

import { generateQrCode } from '@/services/qrService';
import { withDb } from '@/lib/server/db';
import QRCode from 'qrcode';

jest.mock('@/lib/server/db');
jest.mock('qrcode');

const mockInsert = jest.fn().mockResolvedValue({ rows: [{ id: 'uuid-123', token: 'signed-token' }] });
(withDb as jest.Mock).mockImplementation(async (fn) => fn({ query: mockInsert } as any));
(QRCode.toFile as jest.Mock).mockResolvedValue(undefined);

test('generateQrCode creates DB row and PNG', async () => {
  const result = await generateQrCode('target-123');
  expect(result.imagePath).toContain('public/qr/uuid-123.png');
  expect(QRCode.toFile).toHaveBeenCalled();
});

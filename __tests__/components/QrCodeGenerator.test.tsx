import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';

const mockQrResponse = {
  target: { name: 'Test Venue', role: 'venue' },
  ratingUrl: 'https://enlive.app/rate/target-123',
  pngDataUrl: 'data:image/png;base64,abc123',
  svgDataUrl: 'data:image/svg+xml;base64,def456',
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => mockQrResponse,
  } as Response);
});

test('renders download links after generating QR', async () => {
  render(<QrCodeGenerator targetId="target-123" />);
  fireEvent.click(screen.getByText('Generate QR'));

  const pngLink = await waitFor(() => screen.getByText('Download PNG'));
  expect(pngLink).toBeInTheDocument();
  expect(screen.getByText('Download SVG')).toBeInTheDocument();
  expect(screen.getByText('Print QR')).toBeInTheDocument();
  expect(screen.getByText('https://enlive.app/rate/target-123')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/api/qr/generate', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ targetId: 'target-123' }),
  }));
});

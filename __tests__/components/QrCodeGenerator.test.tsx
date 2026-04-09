import { render, screen, waitFor } from '@testing-library/react';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import axios from 'axios';

jest.mock('axios');

const mockResponse = { data: { imageUrl: '/qr/uuid.png', token: 'signed-token' } };
(axios.post as jest.Mock).mockResolvedValue(mockResponse);

test('renders download links after fetching QR', async () => {
  render(<QrCodeGenerator targetId="target-123" />);
  const pngLink = await waitFor(() => screen.getByText('Download PNG'));
  expect(pngLink).toBeInTheDocument();
  const svgLink = await waitFor(() => screen.getByText('Download SVG'));
  expect(svgLink).toBeInTheDocument();
});

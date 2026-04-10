import { render, screen, waitFor } from '@testing-library/react';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import axios from 'axios';

jest.mock('axios');

(test as any)('shows loading and error states', async () => {
  // First render – loading state
  (axios.post as jest.Mock).mockImplementation(() => new Promise(() => {})); // never resolves
  render(<QrCodeGenerator targetId="target-123" />);
  expect(screen.getByText('Generating QR code…')).toBeInTheDocument();

  // Error state
  (axios.post as jest.Mock).mockRejectedValue(new Error('Failed'));
  render(<QrCodeGenerator targetId="target-123" />);
  await waitFor(() => expect(screen.getByText('Failed to generate QR code')).toBeInTheDocument());
});

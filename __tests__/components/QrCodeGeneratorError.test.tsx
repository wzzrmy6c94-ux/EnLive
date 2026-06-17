import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';

beforeEach(() => {
  jest.restoreAllMocks();
});

(test as any)('shows loading and error states', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}) as Promise<Response>);
  render(<QrCodeGenerator targetId="target-123" />);
  fireEvent.click(screen.getByText('Generate QR'));
  expect(screen.getByText('Generating...')).toBeInTheDocument();

  jest.restoreAllMocks();
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Failed' }),
  } as Response);
  render(<QrCodeGenerator targetId="target-123" />);
  fireEvent.click(screen.getAllByText('Generate QR')[1]);
  await waitFor(() => expect(screen.getByText('Failed')).toBeInTheDocument());
});

import { render, screen, waitFor } from '@testing-library/react';
import { PlanManager } from '@/components/PlanManager';
import axios from 'axios';

jest.mock('axios');

const mockPlans = [{ id: 1, name: 'Artist', role: 'artist', price_monthly_cents: 1000, discount_percent: 10 }];
(axios.get as jest.Mock).mockResolvedValue({ data: mockPlans });

test('renders subscription plans', async () => {
  render(<PlanManager />);
  await waitFor(() => expect(screen.getByText(/Artist/)).toBeInTheDocument());
});

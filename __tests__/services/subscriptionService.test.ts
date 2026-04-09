import { createSubscription } from '@/services/subscriptionService';
import { createSquareClient } from '@/lib/squareClient';

jest.mock('@/lib/squareClient');

const mockCreateSubscription = jest.fn();
(createSquareClient as jest.Mock).mockReturnValue({ subscriptionsApi: { createSubscription: mockCreateSubscription } });

jest.mock('@/lib/prisma', () => ({
  subscription_plans: {
    findUnique: jest.fn().mockResolvedValue({ id: 1, price_monthly_cents: 1000, discount_percent: 10 }),
  },
  users: {
    findUnique: jest.fn().mockResolvedValue({ id: 'user-1', square_customer_id: 'cust_123' }),
    update: jest.fn().mockResolvedValue({}),
  },
}));

test('creates Square subscription and stores IDs', async () => {
  mockCreateSubscription.mockResolvedValue({ result: { subscription: { id: 'sub_123' } } });
  const sub = await createSubscription('user-1', '1', 'monthly');
  expect(mockCreateSubscription).toHaveBeenCalled();
  expect(sub.id).toBe('sub_123');
});

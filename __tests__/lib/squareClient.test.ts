import { createSquareClient } from '@/lib/squareClient';

test('creates a Square client with token from env', () => {
  process.env.SQUARE_ACCESS_TOKEN = 'test-token';
  const client = createSquareClient();
  expect(client).toBeDefined();
});

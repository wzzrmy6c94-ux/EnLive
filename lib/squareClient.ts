import { SquareClient, SquareEnvironment } from 'square';

export function createSquareClient() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN not set');
  }
  return new SquareClient({ token, environment: SquareEnvironment.Sandbox });
}

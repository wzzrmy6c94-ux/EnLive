import { Client } from '@square/web-sdk';

export function createSquareClient() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN not set');
  }
  return new Client({ accessToken: token, environment: 'sandbox' });
}

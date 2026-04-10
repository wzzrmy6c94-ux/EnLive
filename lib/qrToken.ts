import jwt from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET must be set');
  return secret;
}

export function createQrToken(targetId: string): string {
  return jwt.sign({ targetId }, getSecret(), { expiresIn: '2h' });
}

export interface QrTokenPayload {
  targetId: string;
  iat: number;
  exp: number;
}

export function verifyQrToken(token: string): QrTokenPayload {
  return jwt.verify(token, getSecret()) as QrTokenPayload;
}

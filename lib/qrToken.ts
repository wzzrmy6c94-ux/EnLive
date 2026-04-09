import jwt from 'jsonwebtoken';

const SECRET = process.env.QR_TOKEN_SECRET;
if (!SECRET) throw new Error('QR_TOKEN_SECRET must be set');

export function createQrToken(targetId: string): string {
  // token valid for 2 hours (handled by verification for expiry)
  return jwt.sign({ targetId }, SECRET, { expiresIn: '2h' });
}

export interface QrTokenPayload {
  targetId: string;
  iat: number;
  exp: number;
}

export function verifyQrToken(token: string): QrTokenPayload {
  return jwt.verify(token, SECRET) as QrTokenPayload;
}

import { NextResponse } from 'next/server';
import { generateQrCode } from '@/services/qrService';
import { z } from 'zod';

const schema = z.object({ targetId: z.string() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { targetId } = parsed.data;
  const { imagePath, token } = await generateQrCode(targetId);
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}${imagePath.replace(/^public/, '')}`;
  return NextResponse.json({ imageUrl, token });
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.subscription_plans.findMany();
  return NextResponse.json(plans);
}

import { NextRequest, NextResponse } from 'next/server';
import { safeEqual } from '@/lib/auth';
import { syncFromReadwise } from '@/lib/readwise-db';

export const maxDuration = 300;

// Vercel Cron sends "Bearer <CRON_SECRET>". Without the secret set, the job stays off.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const result = await syncFromReadwise();
  return NextResponse.json({ success: !result.error, ...result }, { status: result.error ? 500 : 200 });
}

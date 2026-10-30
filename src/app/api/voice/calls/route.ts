import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calls } from '@/lib/schema';
import { requireAdmin } from '@/lib/voice';

/** Recent calls for the console. */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const rows = await db.select().from(calls).orderBy(desc(calls.startedAt)).limit(50);
  return NextResponse.json({ calls: rows });
}

import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calls } from '@/lib/schema';

/** Connor's own sample calls, available to every visitor. */
export async function GET() {
  const rows = await db
    .select({ callSid: calls.callSid, path: calls.path, startedAt: calls.startedAt, durationSec: calls.durationSec })
    .from(calls)
    .where(eq(calls.featured, true))
    .orderBy(desc(calls.startedAt))
    .limit(10);
  return NextResponse.json({ replays: rows });
}

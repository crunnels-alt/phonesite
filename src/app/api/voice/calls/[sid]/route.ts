import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { callEvents, calls } from '@/lib/schema';
import { requireAdmin } from '@/lib/voice';

/** One call and its full event timeline, including private events. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ sid: string }> }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { sid } = await params;
  const [call] = await db.select().from(calls).where(eq(calls.callSid, sid));
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const events = await db
    .select()
    .from(callEvents)
    .where(eq(callEvents.callSid, sid))
    .orderBy(asc(callEvents.at));

  return NextResponse.json({ call, events });
}

import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calls } from '@/lib/schema';
import { publicFeedEvents } from '@/lib/voice';

/** Public events of a featured call. Calls that aren't featured look the same as calls that don't exist. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const [call] = await db
    .select({ callSid: calls.callSid, path: calls.path, model: calls.model })
    .from(calls)
    .where(and(eq(calls.callSid, sid), eq(calls.featured, true)))
    .limit(1);
  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ call, events: await publicFeedEvents(sid) });
}

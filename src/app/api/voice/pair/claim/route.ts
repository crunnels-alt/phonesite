import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { voicePairings } from '@/lib/schema';
import { notifyPaired, publicFeedEvents, requireVoiceSecret, sendFeedEvents } from '@/lib/voice';

/** The voice server reports a code the caller typed. Links that browser to the call and sends it the call so far. */
export async function POST(request: NextRequest) {
  const unauthorized = requireVoiceSecret(request);
  if (unauthorized) return unauthorized;

  let body: { callSid?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { callSid, code } = body;
  if (typeof callSid !== 'string' || !callSid.startsWith('CA') || typeof code !== 'string' || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: 'callSid and a 4-digit code are required' }, { status: 400 });
  }

  const now = new Date();
  const [pairing] = await db
    .update(voicePairings)
    .set({ callSid, claimedAt: now })
    .where(and(eq(voicePairings.code, code), gt(voicePairings.expiresAt, now), isNull(voicePairings.claimedAt)))
    .returning({ channel: voicePairings.channel });
  if (!pairing) return NextResponse.json({ error: 'No browser is showing that code' }, { status: 404 });

  try {
    await notifyPaired(pairing.channel, callSid);
    await sendFeedEvents(pairing.channel, callSid, await publicFeedEvents(callSid));
  } catch (error) {
    console.error('Pairing notify failed:', error);
  }
  return NextResponse.json({ paired: true });
}

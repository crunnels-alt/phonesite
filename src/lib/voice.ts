import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { safeEqual } from '@/lib/auth';
import { getPusher } from '@/lib/pusher';
import { db } from '@/lib/db';
import { callEvents, callers, calls, voicePairings } from '@/lib/schema';
import type { CallEvent, CallPath } from '@/lib/schema';

/** Voice servers authenticate with a shared secret. Returns an error response, or null when authorized. */
export function requireVoiceSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.VOICE_API_SECRET;
  const header = request.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function isValidTwilioRequest(request: NextRequest, params: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get('x-twilio-signature');
  if (!authToken || !signature) return false;
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], request.url);
  const expected = crypto.createHmac('sha1', authToken).update(payload, 'utf8').digest('base64');
  return safeEqual(expected, signature);
}

/** Keyed hash so stored hashes can't be reversed by trying every phone number. */
export function hashPhone(phoneNumber: string): string {
  const key = process.env.PHONE_HASH_KEY;
  if (!key) throw new Error('PHONE_HASH_KEY not configured');
  return crypto.createHmac('sha256', key).update(phoneNumber).digest('hex');
}

export interface CallUpsert {
  callSid: string;
  from?: string;
  to?: string;
  path?: CallPath;
  model?: string;
  startedAt?: string;
  endedAt?: string;
  endReason?: string;
  durationSec?: number;
}

/** Create or update the call row (and its caller) so events can reference it. Safe to call repeatedly. */
export async function upsertCall(call: CallUpsert): Promise<void> {
  let callerId: string | undefined;
  if (call.from) {
    const [caller] = await db
      .insert(callers)
      .values({ phoneHash: hashPhone(call.from) })
      .onConflictDoUpdate({
        target: callers.phoneHash,
        set: { lastSeenAt: sql`now()` },
      })
      .returning({ id: callers.id });
    callerId = caller.id;
  }

  const updates = {
    ...(callerId && { callerId }),
    ...(call.to && { toNumber: call.to }),
    ...(call.path && { path: call.path }),
    ...(call.model && { model: call.model }),
    ...(call.endedAt && { endedAt: new Date(call.endedAt) }),
    ...(call.endReason && { endReason: call.endReason }),
    ...(call.durationSec !== undefined && { durationSec: call.durationSec }),
  };

  const inserted = await db
    .insert(calls)
    .values({
      callSid: call.callSid,
      ...updates,
      ...(call.startedAt && { startedAt: new Date(call.startedAt) }),
    })
    .onConflictDoNothing()
    .returning({ callSid: calls.callSid });

  if (inserted.length === 0 && Object.keys(updates).length > 0) {
    await db.update(calls).set(updates).where(sql`${calls.callSid} = ${call.callSid}`);
  } else if (inserted.length > 0 && callerId) {
    await db.update(callers).set({ callCount: sql`${callers.callCount} + 1` }).where(sql`${callers.id} = ${callerId}`);
  }
}

/** What a browser receives for each event. Only public events are ever sent. */
export interface FeedEvent {
  at: string;
  source: string;
  stage: string;
  type: string;
  turn: number | null;
  data: Record<string, unknown>;
}

export const toFeedEvent = (event: Pick<CallEvent, 'at' | 'source' | 'stage' | 'type' | 'turn' | 'data'>): FeedEvent => ({
  at: new Date(event.at).toISOString(),
  source: event.source,
  stage: event.stage,
  type: event.type,
  turn: event.turn,
  data: event.data,
});

export async function publicFeedEvents(callSid: string): Promise<FeedEvent[]> {
  const rows = await db
    .select()
    .from(callEvents)
    .where(and(eq(callEvents.callSid, callSid), eq(callEvents.visibility, 'public')))
    .orderBy(asc(callEvents.at));
  return rows.map(toFeedEvent);
}

// Pusher rejects messages over 10KB, so events go out in batches under that.
const MAX_MESSAGE_BYTES = 8000;

export async function sendFeedEvents(channel: string, callSid: string, events: FeedEvent[]): Promise<void> {
  let batch: FeedEvent[] = [];
  let size = 0;
  const send = async () => {
    if (batch.length) await getPusher().trigger(channel, 'events', { callSid, events: batch });
    batch = [];
    size = 0;
  };
  for (const event of events) {
    const bytes = Buffer.byteLength(JSON.stringify(event));
    if (bytes > MAX_MESSAGE_BYTES) continue;
    if (size + bytes > MAX_MESSAGE_BYTES) await send();
    batch.push(event);
    size += bytes;
  }
  await send();
}

export async function notifyPaired(channel: string, callSid: string): Promise<void> {
  await getPusher().trigger(channel, 'paired', { callSid });
}

/** Forward newly stored public events to every browser paired with this call. */
export async function forwardToPairedBrowsers(callSid: string, events: FeedEvent[]): Promise<void> {
  if (!events.length) return;
  const pairings = await db
    .select({ channel: voicePairings.channel })
    .from(voicePairings)
    .where(and(eq(voicePairings.callSid, callSid), isNotNull(voicePairings.claimedAt)));
  await Promise.all(pairings.map(({ channel }) => sendFeedEvents(channel, callSid, events)));
}

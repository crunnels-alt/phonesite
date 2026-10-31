import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { safeEqual } from '@/lib/auth';
import { db } from '@/lib/db';
import { callers, calls } from '@/lib/schema';
import type { CallPath } from '@/lib/schema';


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

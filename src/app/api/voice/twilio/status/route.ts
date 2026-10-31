import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callEvents } from '@/lib/schema';
import type { CallEvent } from '@/lib/schema';
import { isValidTwilioRequest } from '@/lib/twilio';
import { forwardToPairedBrowsers, toFeedEvent, upsertCall } from '@/lib/voice';

/**
 * Twilio status callback for the agent line's number.
 * Records Twilio's own view of the call (initiated, ringing, answered, completed) in the same timeline.
 */
export async function POST(request: NextRequest) {
  const params = Object.fromEntries(new URLSearchParams(await request.text()));
  if (!isValidTwilioRequest(request, params)) {
    return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
  }

  const { CallSid: callSid, CallStatus: status, From: from, To: to, CallDuration: duration } = params;
  if (!callSid || !status) return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });

  const done = ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status);
  const timestamp = params.Timestamp ? new Date(params.Timestamp) : new Date();

  let event: CallEvent;
  try {
    await upsertCall({
      callSid,
      from,
      to,
      ...(done && {
        endedAt: timestamp.toISOString(),
        endReason: status,
        durationSec: duration ? Number(duration) : undefined,
      }),
    });
    [event] = await db.insert(callEvents).values({
      callSid,
      at: timestamp,
      source: 'twilio',
      stage: 'phone',
      visibility: 'public',
      type: `call.${status}`,
      data: {
        direction: params.Direction,
        ...(duration && { durationSec: Number(duration) }),
        ...(params.SipResponseCode && { sipResponseCode: params.SipResponseCode }),
        ...(params.SequenceNumber && { sequence: Number(params.SequenceNumber) }),
      },
    }).returning();
  } catch (error) {
    console.error('Voice status callback failed:', error);
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  try {
    await forwardToPairedBrowsers(callSid, [toFeedEvent(event)]);
  } catch (error) {
    console.error('Voice status forward failed:', error);
  }

  return new NextResponse(null, { status: 204 });
}

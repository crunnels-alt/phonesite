import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callEvents } from '@/lib/schema';
import type { CallEvent, EventSource, EventStage, EventVisibility, NewCallEvent } from '@/lib/schema';
import { forwardToPairedBrowsers, requireVoiceSecret, toFeedEvent, upsertCall } from '@/lib/voice';
import type { CallUpsert } from '@/lib/voice';

const SOURCES: EventSource[] = ['twilio', 'runtime', 'console', 'page'];
const STAGES: EventStage[] = ['phone', 'stt', 'turn', 'llm', 'tool', 'tts', 'rcs', 'control'];
const VISIBILITIES: EventVisibility[] = ['public', 'private'];
const MAX_EVENTS = 200;

interface EventInput {
  at: string;
  source: EventSource;
  stage: EventStage;
  visibility?: EventVisibility;
  type: string;
  turn?: number | null;
  data?: Record<string, unknown>;
}

interface EventBatch {
  call: CallUpsert;
  events: EventInput[];
}

function parseEvent(input: EventInput, callSid: string): NewCallEvent | null {
  const at = new Date(input.at);
  if (Number.isNaN(at.getTime())) return null;
  if (!SOURCES.includes(input.source) || !STAGES.includes(input.stage)) return null;
  if (typeof input.type !== 'string' || !input.type) return null;
  return {
    callSid,
    at,
    source: input.source,
    stage: input.stage,
    visibility: VISIBILITIES.includes(input.visibility as EventVisibility) ? input.visibility : 'private',
    type: input.type.slice(0, 64),
    turn: typeof input.turn === 'number' ? input.turn : null,
    data: input.data && typeof input.data === 'object' ? input.data : {},
  };
}

/**
 * Batched call events from the voice servers (Railway).
 * Upserts the call row first so events always have a parent.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireVoiceSecret(request);
  if (unauthorized) return unauthorized;

  let batch: EventBatch;
  try {
    batch = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const callSid = batch.call?.callSid;
  if (typeof callSid !== 'string' || !callSid.startsWith('CA')) {
    return NextResponse.json({ error: 'call.callSid is required' }, { status: 400 });
  }
  const inputs = Array.isArray(batch.events) ? batch.events.slice(0, MAX_EVENTS) : [];
  const rows = inputs.map((e) => parseEvent(e, callSid)).filter((e): e is NewCallEvent => e !== null);

  try {
    await upsertCall(batch.call);
    if (rows.length > 0) await db.insert(callEvents).values(rows);
  } catch (error) {
    console.error('Voice events insert failed:', error);
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  // The events are stored, so a failed live update must not make the voice server resend them.
  try {
    const publicEvents = rows.filter((row) => row.visibility === 'public').map((row) => toFeedEvent(row as CallEvent));
    await forwardToPairedBrowsers(callSid, publicEvents);
  } catch (error) {
    console.error('Voice events forward failed:', error);
  }

  return NextResponse.json({ inserted: rows.length, rejected: inputs.length - rows.length });
}

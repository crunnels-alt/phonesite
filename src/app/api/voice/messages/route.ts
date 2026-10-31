import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { calls, messages } from '@/lib/schema';
import { requireVoiceSecret } from '@/lib/voice';

type Urgency = 'low' | 'normal' | 'high';

const URGENCIES: Urgency[] = ['low', 'normal', 'high'];
const MAX_BODY = 2000;

const optionalText = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

/** The voice agent saves a message a caller left for Connor, then emails him about it. */
export async function POST(request: NextRequest) {
  const unauthorized = requireVoiceSecret(request);
  if (unauthorized) return unauthorized;

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { callSid } = input;
  const body = optionalText(input.body, MAX_BODY);
  if (typeof callSid !== 'string' || !callSid.startsWith('CA') || !body) {
    return NextResponse.json({ error: 'callSid and body are required' }, { status: 400 });
  }
  const name = optionalText(input.name, 120);
  const callbackNumber = optionalText(input.callbackNumber, 40);
  const urgency = URGENCIES.includes(input.urgency as Urgency) ? (input.urgency as Urgency) : 'normal';

  const [call] = await db.select({ callerId: calls.callerId }).from(calls).where(eq(calls.callSid, callSid));
  if (!call) return NextResponse.json({ error: 'Unknown call' }, { status: 404 });

  const [saved] = await db
    .insert(messages)
    .values({ callSid, callerId: call.callerId, name, callbackNumber, body, urgency })
    .returning({ id: messages.id });

  if (process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: process.env.CONTACT_NOTIFICATION_EMAIL || 'connorrunnels@gmail.com',
        subject: `${urgency === 'high' ? 'Urgent phone message' : 'Phone message'} from ${name ?? 'a caller'}`,
        text: [`From: ${name ?? 'not given'}`, `Call back: ${callbackNumber ?? 'not given'}`, `Urgency: ${urgency}`, '', body, '', `Call: ${callSid}`].join('\n'),
      });
    } catch (error) {
      // The message is saved either way; email is only the nudge.
      console.error('Phone message email failed:', error);
    }
  }

  return NextResponse.json({ saved: true, id: saved.id });
}

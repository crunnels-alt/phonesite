import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { db } from '@/lib/db';
import { sessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Validates a Twilio webhook request signature using HMAC-SHA1
 */
function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dev Mode] Skipping Twilio signature validation');
    return true;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured');
    return false;
  }

  let data = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Twilio Status Callback
 * Called when call status changes (initiated, ringing, answered, completed)
 * We use this to detect when a call ends
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const twilioSignature = request.headers.get('x-twilio-signature');

    if (!twilioSignature) {
      return NextResponse.json({ error: 'Missing Twilio signature' }, { status: 401 });
    }

    const formData = new URLSearchParams(body);
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    const url = request.url;
    const isValid = validateTwilioSignature(url, params, twilioSignature);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 401 });
    }

    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');

    console.log(`Status callback: ${callSid} -> ${callStatus}`);

    // When call is completed, end the session
    if (callStatus === 'completed' && callSid) {
      // Find and update the session
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.callSid, callSid));

      if (session) {
        // Update session end time
        await db
          .update(sessions)
          .set({ endedAt: new Date() })
          .where(eq(sessions.id, session.id));

        // Notify website that session has ended
        await pusher.trigger('website-navigation', 'session-ended', {
          sessionId: session.id,
          timestamp: new Date().toISOString(),
        });

        console.log(`Session ended: ${session.id}`);
      }
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error processing status callback:', error);
    return new Response('', { status: 200 });
  }
}

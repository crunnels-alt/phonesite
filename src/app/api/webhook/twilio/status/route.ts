import { NextRequest, NextResponse } from 'next/server';
import { getPusher } from '@/lib/pusher';
import { db } from '@/lib/db';
import { sessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isValidTwilioRequest } from '@/lib/twilio';

/**
 * Twilio Status Callback
 * Called when call status changes (initiated, ringing, answered, completed)
 * We use this to detect when a call ends
 */
export async function POST(request: NextRequest) {
  try {
    const formData = new URLSearchParams(await request.text());
    const params = Object.fromEntries(formData);

    if (!isValidTwilioRequest(request, params, { skipInDevelopment: true })) {
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
        await getPusher().trigger('website-navigation', 'session-ended', {
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

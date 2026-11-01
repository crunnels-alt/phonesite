import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getPusher } from '@/lib/pusher';
import { sessions, sessionEvents, photos, readwiseHighlights } from '@/lib/schema';
import { sectionById, sectionByDigit } from '@/lib/sections';
import { isValidTwilioRequest } from '@/lib/twilio';

// Pressing one of these digits again shows a random photo or highlight.
const SPOTLIGHT_SECTIONS = ['photo', 'reading'];

interface TwilioWebhookBody {
  From: string;
  Digits: string;
  CallSid: string;
  AccountSid: string;
  [key: string]: string;
}


export async function GET() {
  return NextResponse.json({
    message: 'Twilio webhook endpoint is working',
    method: 'This endpoint accepts POST requests from Twilio'
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = new URLSearchParams(await request.text());
    const params = Object.fromEntries(formData);

    if (!isValidTwilioRequest(request, params, { skipInDevelopment: true })) {
      return NextResponse.json(
        { error: 'Invalid Twilio signature' },
        { status: 401 }
      );
    }
    const webhookData: TwilioWebhookBody = {
      From: formData.get('From') || '',
      Digits: formData.get('Digits') || '',
      CallSid: formData.get('CallSid') || '',
      AccountSid: formData.get('AccountSid') || '',
    };

    const phoneNumber = webhookData.From;
    const pressedDigit = webhookData.Digits;
    const callSid = webhookData.CallSid;

    // If no digit was pressed yet (initial call), create session and provide the main menu
    if (!pressedDigit) {
      // Create a new session for this call
      const phoneHash = phoneNumber
        ? crypto.createHash('sha256').update(phoneNumber).digest('hex').slice(0, 16)
        : null;

      const [session] = await db.insert(sessions).values({
        callSid,
        phoneNumberHash: phoneHash,
      }).returning();

      // Notify the website that a new session has started
      await getPusher().trigger('website-navigation', 'session-started', {
        sessionId: session.id,
        timestamp: session.startedAt,
      });

      console.log(`New session created: ${session.id} for call ${callSid}`);

      const welcomeTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome. Press 1 for About, 2 for Resume, 3 for Photo, 4 for Projects, 5 for Reading, 6 for Listening, or 0 for Home.</Say>
  <Gather numDigits="1" timeout="10" action="${new URL(request.url).origin}/api/webhook/twilio">
    <Say voice="alice">Please press a digit to navigate.</Say>
  </Gather>
  <Say voice="alice">Thank you for calling!</Say>
</Response>`;

      return new Response(welcomeTwiml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      });
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Missing phone number' },
        { status: 400 }
      );
    }

    // Get current section from URL query param (for spotlight detection)
    const urlParams = new URL(request.url).searchParams;
    const currentSection = urlParams.get('section') || 'home';

    const newState = getNextState(pressedDigit);

    // Look up the session for this call
    const [session] = await db.select().from(sessions).where(eq(sessions.callSid, callSid));

    // Every visit is recorded so the end-of-call page can show the caller's path through the site.
    if (session?.id && newState !== 'unknown') {
      await db.insert(sessionEvents).values({ sessionId: session.id, section: newState });
    }
    const baseUrl = new URL(request.url).origin;

    // Check if this is spotlight mode (same section pressed again)
    const isSpotlight = currentSection === newState && SPOTLIGHT_SECTIONS.includes(newState);

    if (isSpotlight) {
      // Get random content for spotlight
      const randomContent = await getRandomContent(newState);

      if (randomContent) {
        // Record the spotlight in session_events for the artifact
        if (session?.id) {
          await db.insert(sessionEvents).values({
            sessionId: session.id,
            section: newState,
            contentType: randomContent.type,
            contentIds: [randomContent.id],
          });
        }

        await getPusher().trigger('website-navigation', 'content-spotlight', {
          sessionId: session?.id,
          section: newState,
          contentId: randomContent.id,
          contentType: randomContent.type,
          timestamp: new Date().toISOString(),
        });

        console.log(`Spotlight: ${newState} -> ${randomContent.type} ${randomContent.id}`);

        // On subsequent spotlights, just silently wait - no voice prompt needed
        const spotlightTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="30" action="${baseUrl}/api/webhook/twilio?section=${newState}">
  </Gather>
  <Say voice="alice">Thank you for exploring!</Say>
</Response>`;

        return new Response(spotlightTwiml, {
          status: 200,
          headers: { 'Content-Type': 'application/xml' },
        });
      }
    }

    // Regular section change
    await getPusher().trigger('website-navigation', 'section-changed', {
      sessionId: session?.id,
      currentSection: newState,
      pressedDigit,
      timestamp: new Date().toISOString(),
    });

    console.log(`Website navigation: digit ${pressedDigit} -> ${newState}`);

    // For content sections, immediately spotlight a random item
    let twimlResponse: string;
    if (SPOTLIGHT_SECTIONS.includes(newState)) {
      const randomContent = await getRandomContent(newState);

      if (randomContent) {
        // Record the spotlight in session_events for the artifact
        if (session?.id) {
          await db.insert(sessionEvents).values({
            sessionId: session.id,
            section: newState,
            contentType: randomContent.type,
            contentIds: [randomContent.id],
          });
        }

        // Also send spotlight event
        await getPusher().trigger('website-navigation', 'content-spotlight', {
          sessionId: session?.id,
          section: newState,
          contentId: randomContent.id,
          contentType: randomContent.type,
          timestamp: new Date().toISOString(),
        });

        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="30" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">${getStateDisplayName(newState)}. Press ${pressedDigit} for another.</Say>
  </Gather>
  <Say voice="alice">Thank you for exploring!</Say>
</Response>`;
      } else {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${getStateDisplayName(newState)}. Nothing here yet.</Say>
  <Gather numDigits="1" timeout="10" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press 0 for Home, or 1 to 6 for other sections.</Say>
  </Gather>
</Response>`;
      }
    } else {
      // Non-content sections (home, about, listening)
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${getStateDisplayName(newState)}.</Say>
  <Gather numDigits="1" timeout="10" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press 0 for Home, or 1 to 6 for other sections.</Say>
  </Gather>
  <Say voice="alice">Thank you for visiting!</Say>
</Response>`;
    }

    return new Response(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your request. Please try again.</Say>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

function getNextState(digit: string): string {
  return sectionByDigit(digit)?.id ?? 'unknown';
}

function getStateDisplayName(state: string): string {
  return sectionById(state)?.label ?? 'Unknown Section';
}

// Get a random content item from a section
async function getRandomContent(section: string): Promise<{ id: string; type: string; title?: string } | null> {
  try {
    switch (section) {
      case 'photo': {
        const [photo] = await db.select({ id: photos.id, title: photos.title })
          .from(photos)
          .orderBy(sql`RANDOM()`)
          .limit(1);
        return photo ? { id: photo.id, type: 'photo', title: photo.title } : null;
      }
      case 'reading': {
        const [highlight] = await db.select({ id: readwiseHighlights.id })
          .from(readwiseHighlights)
          .orderBy(sql`RANDOM()`)
          .limit(1);
        return highlight ? { id: String(highlight.id), type: 'highlight' } : null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting random content:', error);
    return null;
  }
}


import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { recordWebsiteNavigation, navigationDB } from '@/lib/database';
import { db } from '@/lib/db';
import { sessions, sessionEvents, photos, projects, writings, readwiseHighlights } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface TwilioWebhookBody {
  From: string;
  Digits: string;
  CallSid: string;
  AccountSid: string;
  [key: string]: string;
}

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Validates a Twilio webhook request signature using HMAC-SHA1
 * Implementation based on Twilio's official documentation:
 * https://www.twilio.com/docs/usage/security#validating-requests
 *
 * @param url - The full URL of the webhook (including protocol and domain)
 * @param params - The POST body parameters as an object
 * @param signature - The X-Twilio-Signature header value
 * @returns true if signature is valid, false otherwise
 */
function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  // In development, skip validation for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dev Mode] Skipping Twilio signature validation');
    return true;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured');
    return false;
  }

  // Build the signature data per Twilio's spec:
  // 1. Start with the full URL
  // 2. Sort parameters alphabetically by key
  // 3. Append each key-value pair (no separators)
  let data = url;

  // Sort parameters alphabetically and append to URL
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Create HMAC-SHA1 hash and encode as base64
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data, 'utf8')
    .digest('base64');

  // Compare signatures using timing-safe comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.error('Invalid Twilio signature', {
      url,
      receivedSignature: signature,
      expectedSignature,
      paramsKeys: sortedKeys
    });
  }

  return isValid;
}

export async function GET() {
  return NextResponse.json({
    message: 'Twilio webhook endpoint is working',
    method: 'This endpoint accepts POST requests from Twilio'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const twilioSignature = request.headers.get('x-twilio-signature');

    if (!twilioSignature) {
      return NextResponse.json(
        { error: 'Missing Twilio signature' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = new URLSearchParams(body);

    // Convert URLSearchParams to plain object for validation
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    // Get the full URL for validation (must match what Twilio used to sign)
    const url = request.url;

    // Validate the Twilio signature
    const isValid = validateTwilioSignature(url, params, twilioSignature);

    if (!isValid) {
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
      await pusher.trigger('website-navigation', 'session-started', {
        sessionId: session.id,
        timestamp: session.startedAt,
      });

      console.log(`New session created: ${session.id} for call ${callSid}`);

      const welcomeTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome to the phone navigation system! Press 1 for About, 2 for Projects, 3 for Photo, 4 for Writing, 5 for Reading Notes, or 0 for Home.</Say>
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
    const navigationEvent = await recordWebsiteNavigation(
      phoneNumber,
      pressedDigit,
      newState,
      callSid
    );

    // Look up the session for this call
    const [session] = await db.select().from(sessions).where(eq(sessions.callSid, callSid));

    const currentWebsiteState = await navigationDB.getCurrentState();
    const baseUrl = new URL(request.url).origin;

    // Check if this is spotlight mode (same section pressed again)
    const isSpotlight = currentSection === newState && ['photo', 'projects', 'writing', 'reading'].includes(newState);

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

        await pusher.trigger('website-navigation', 'content-spotlight', {
          sessionId: session?.id,
          section: newState,
          contentId: randomContent.id,
          contentType: randomContent.type,
          timestamp: new Date().toISOString(),
        });

        console.log(`Spotlight: ${newState} -> ${randomContent.type} ${randomContent.id}`);

        const spotlightTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${randomContent.title ? randomContent.title : 'Here is something'}.</Say>
  <Gather numDigits="1" timeout="15" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press ${pressedDigit} for another, or choose: 1 About, 2 Projects, 3 Photos, 4 Writing, 5 Reading, 0 Home.</Say>
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
    await pusher.trigger('website-navigation', 'section-changed', {
      sessionId: session?.id,
      currentSection: newState,
      pressedDigit,
      timestamp: navigationEvent.timestamp,
      totalNavigations: currentWebsiteState.totalNavigations,
      recentEvent: navigationEvent
    });

    console.log(`Website navigation: digit ${pressedDigit} -> ${newState} (Total: ${currentWebsiteState.totalNavigations})`);

    // For content sections, immediately spotlight a random item
    let twimlResponse: string;
    if (['photo', 'projects', 'writing', 'reading'].includes(newState)) {
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
        await pusher.trigger('website-navigation', 'content-spotlight', {
          sessionId: session?.id,
          section: newState,
          contentId: randomContent.id,
          contentType: randomContent.type,
          timestamp: new Date().toISOString(),
        });

        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${getStateDisplayName(newState)}. ${randomContent.title ? randomContent.title : 'Here is something'}.</Say>
  <Gather numDigits="1" timeout="15" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press ${pressedDigit} for another, or choose a different section.</Say>
  </Gather>
  <Say voice="alice">Thank you for exploring!</Say>
</Response>`;
      } else {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${getStateDisplayName(newState)}. Nothing here yet.</Say>
  <Gather numDigits="1" timeout="10" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press 1 for About, 2 for Projects, 3 for Photos, 4 for Writing, 5 for Reading, 0 for Home.</Say>
  </Gather>
</Response>`;
      }
    } else {
      // Non-content sections (home, about)
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${getStateDisplayName(newState)}.</Say>
  <Gather numDigits="1" timeout="10" action="${baseUrl}/api/webhook/twilio?section=${newState}">
    <Say voice="alice">Press 1 for About, 2 for Projects, 3 for Photos, 4 for Writing, 5 for Reading, 0 for Home.</Say>
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
  const stateMap: Record<string, string> = {
    '1': 'about',
    '2': 'projects',
    '3': 'photo',
    '4': 'writing',
    '5': 'reading',
    '0': 'home',
    '*': 'previous',
    '#': 'confirm',
  };

  return stateMap[digit] || 'unknown';
}

function getStateDisplayName(state: string): string {
  const stateNames: Record<string, string> = {
    'about': 'About',
    'projects': 'Projects',
    'photo': 'Photo',
    'writing': 'Writing',
    'reading': 'Reading Notes',
    'home': 'Home',
    'previous': 'Previous',
    'confirm': 'Confirmed',
    'unknown': 'Unknown Section',
  };
  return stateNames[state] || state;
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
      case 'projects': {
        const [project] = await db.select({ id: projects.id, title: projects.title })
          .from(projects)
          .orderBy(sql`RANDOM()`)
          .limit(1);
        return project ? { id: project.id, type: 'project', title: project.title } : null;
      }
      case 'writing': {
        const [writing] = await db.select({ id: writings.id, title: writings.title })
          .from(writings)
          .orderBy(sql`RANDOM()`)
          .limit(1);
        return writing ? { id: writing.id, type: 'writing', title: writing.title } : null;
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


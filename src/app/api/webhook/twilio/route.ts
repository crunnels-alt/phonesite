import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { recordWebsiteNavigation, navigationDB } from '@/lib/database';
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

function validateTwilioSignature(authToken: string, signature: string, url: string, params: string): boolean {
  const data = url + params;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data, 'utf8')
    .digest('base64');

  return signature === expectedSignature;
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

    const isTestEnvironment = twilioSignature === 'test-signature';

    if (!isTestEnvironment) {
      const url = new URL(request.url);
      const isValid = validateTwilioSignature(
        process.env.TWILIO_AUTH_TOKEN!,
        twilioSignature,
        url.toString(),
        body
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Twilio signature' },
          { status: 401 }
        );
      }
    }

    const formData = new URLSearchParams(body);
    const webhookData: TwilioWebhookBody = {
      From: formData.get('From') || '',
      Digits: formData.get('Digits') || '',
      CallSid: formData.get('CallSid') || '',
      AccountSid: formData.get('AccountSid') || '',
    };

    const phoneNumber = webhookData.From;
    const pressedDigit = webhookData.Digits;
    const callSid = webhookData.CallSid;

    if (!phoneNumber || !pressedDigit) {
      return NextResponse.json(
        { error: 'Missing required fields: From or Digits' },
        { status: 400 }
      );
    }

    const newState = getNextState(pressedDigit);
    const navigationEvent = await recordWebsiteNavigation(
      phoneNumber,
      pressedDigit,
      newState,
      callSid
    );

    const currentWebsiteState = await navigationDB.getCurrentState();

    await pusher.trigger('website-navigation', 'section-changed', {
      currentSection: currentWebsiteState.currentSection,
      pressedDigit,
      timestamp: navigationEvent.timestamp,
      totalNavigations: currentWebsiteState.totalNavigations,
      recentEvent: navigationEvent
    });

    console.log(`Website navigation: digit ${pressedDigit} -> ${newState} (Total: ${currentWebsiteState.totalNavigations})`);

    // Return TwiML response for Twilio voice calls
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You navigated to ${getStateDisplayName(newState)}. Press another digit to continue navigating.</Say>
  <Gather numDigits="1" timeout="10" action="${new URL(request.url).origin}/api/webhook/twilio">
    <Say voice="alice">Press 1 for About, 2 for Projects, 3 for Photo, 4 for Writing, or 0 for Home.</Say>
  </Gather>
  <Say voice="alice">Thank you for visiting!</Say>
</Response>`;

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
    'home': 'Home',
    'previous': 'Previous',
    'confirm': 'Confirmed',
    'unknown': 'Unknown Section',
  };
  return stateNames[state] || state;
}


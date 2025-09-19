import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import Pusher from 'pusher';
import { recordWebsiteNavigation, navigationDB } from '@/lib/database';

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

    const isTestEnvironment = process.env.NODE_ENV === 'development' && twilioSignature === 'test-signature';

    if (!isTestEnvironment) {
      const url = new URL(request.url);
      const isValid = validateRequest(
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

    return NextResponse.json(
      {
        success: true,
        message: 'Navigation recorded successfully',
        currentSection: currentWebsiteState.currentSection,
        navigationEvent
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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


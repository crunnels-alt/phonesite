import { NextRequest, NextResponse } from 'next/server';

interface TestWebhookRequest {
  phoneNumber: string;
  digit: string;
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint is working',
    usage: 'Send POST request with phoneNumber and digit to test'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, digit }: TestWebhookRequest = await request.json();

    if (!phoneNumber || !digit) {
      return NextResponse.json(
        { error: 'Missing phoneNumber or digit' },
        { status: 400 }
      );
    }

    const webhookUrl = new URL('/api/webhook/twilio', request.url);

    const formData = new URLSearchParams();
    formData.append('From', phoneNumber);
    formData.append('Digits', digit);
    formData.append('CallSid', `CA${Math.random().toString(36).substring(2, 15)}`);
    formData.append('AccountSid', 'ACtest123456789');

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-twilio-signature': 'test-signature',
      },
      body: formData.toString(),
    });

    const result = await response.text();

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent',
      webhookResponse: {
        status: response.status,
        data: result,
        contentType: response.headers.get('content-type')
      }
    });

  } catch (error) {
    console.error('Error sending test webhook:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}
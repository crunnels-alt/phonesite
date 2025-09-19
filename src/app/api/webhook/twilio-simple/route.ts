// import { NextRequest } from 'next/server';

export async function POST() {
  console.log('Twilio webhook called');

  const simpleTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is a test. Press any key.</Say>
  <Gather numDigits="1" timeout="5">
    <Say voice="alice">Press a number.</Say>
  </Gather>
</Response>`;

  return new Response(simpleTwiml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

export async function GET() {
  return new Response('Simple Twilio webhook test endpoint');
}
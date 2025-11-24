import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Store in database
    await db.insert(contactMessages).values({
      name,
      email,
      message,
    });

    // TODO: Send email notification using Resend or similar service
    // if (process.env.RESEND_API_KEY) {
    //   await resend.emails.send({
    //     from: 'website@connorrunnels.com',
    //     to: 'connorrunnels@gmail.com',
    //     subject: `New contact from ${name}`,
    //     text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      },
      { status: 500 }
    );
  }
}

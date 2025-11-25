import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { getIdentifier, checkAuthRateLimit } from '@/lib/ratelimit';

// Initialize Resend client (only if API key is configured)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  // Strict rate limiting for contact form to prevent spam (5/min)
  const rateLimitResponse = await checkAuthRateLimit(getIdentifier(request));
  if (rateLimitResponse) return rateLimitResponse;

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

    // Send email notification if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: process.env.CONTACT_NOTIFICATION_EMAIL || 'connorrunnels@gmail.com',
          subject: `New contact from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
          replyTo: email,
        });
      } catch (emailError) {
        // Log email error but don't fail the request - message is saved in DB
        console.error('Failed to send email notification:', emailError);
      }
    }

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

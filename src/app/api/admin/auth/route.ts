import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit, getIdentifier, checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting to prevent brute force attacks
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkRateLimit(authRateLimit, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { authenticated: false, error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    const authenticated = password === adminPassword;

    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

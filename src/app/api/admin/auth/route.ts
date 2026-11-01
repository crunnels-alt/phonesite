import { NextRequest, NextResponse } from 'next/server';
import { getIdentifier, checkAuthRateLimit } from '@/lib/ratelimit';
import { clearSessionCookie, createSessionToken, isAdminRequest, safeEqual, setSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkAuthRateLimit(identifier);
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

    const authenticated = typeof password === 'string' && safeEqual(password, adminPassword);
    if (!authenticated) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const token = createSessionToken();
    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'Session could not be created' }, { status: 500 });
    }

    const response = NextResponse.json({ authenticated: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearSessionCookie(response);
  return response;
}

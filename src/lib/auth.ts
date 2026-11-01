import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'phonesite_admin';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/** ADMIN_SESSION_SECRET when set; otherwise derived from ADMIN_PASSWORD so a password change ends every session. */
function sessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return explicit;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHmac('sha256', password).update('phonesite-admin-session-v1').digest('hex');
}

const sign = (payload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('base64url');

export function createSessionToken(now: number = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifySessionToken(token: string | undefined, now: number = Date.now()): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expires, signature, ...rest] = token.split('.');
  if (!expires || !signature || rest.length > 0 || !/^\d+$/.test(expires)) return false;
  if (!safeEqual(signature, sign(expires, secret))) return false;
  return Number(expires) > now;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function isAdminRequest(request: NextRequest): boolean {
  if (verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return true;
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get('authorization') ?? '';
  return Boolean(password) && safeEqual(header, `Bearer ${password}`);
}

/** Admin routes accept the session cookie or the admin password as a Bearer token. Returns an error response, or null when authorized. */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (isAdminRequest(request)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

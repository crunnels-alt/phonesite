import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/** Admin routes take the admin password as a Bearer token. Returns an error response, or null when authorized. */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get('authorization') ?? '';
  if (!password || !safeEqual(header, `Bearer ${password}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

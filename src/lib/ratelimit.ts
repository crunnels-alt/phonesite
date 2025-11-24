/**
 * Rate limiting utilities using Upstash Redis
 *
 * Different tiers for different endpoint types:
 * - Strict: Auth endpoints (5 requests/minute)
 * - Upload: File uploads (10 requests/hour)
 * - Standard: CRUD operations (30 requests/minute)
 * - Lenient: Read-only/cached endpoints (60 requests/minute)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// Strict rate limit for authentication endpoints
export const authRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit:auth',
});

// Upload rate limit for file uploads
export const uploadRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  analytics: true,
  prefix: '@upstash/ratelimit:upload',
});

// Standard rate limit for CRUD operations
export const standardRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit:standard',
});

// Lenient rate limit for read-only endpoints
export const lenientRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit:lenient',
});

/**
 * Get identifier for rate limiting (IP address or fallback)
 */
export function getIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (handles proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'anonymous';
}

/**
 * Apply rate limit and return appropriate response if exceeded
 *
 * @param rateLimit - The rate limiter to use
 * @param identifier - The identifier to rate limit (usually IP)
 * @returns null if allowed, NextResponse if rate limit exceeded
 */
export async function checkRateLimit(
  rateLimit: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  // In development, skip rate limiting for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dev Mode] Skipping rate limit check');
    return null;
  }

  const { success, limit, reset, remaining } = await rateLimit.limit(identifier);

  if (!success) {
    console.warn(`Rate limit exceeded for ${identifier}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        limit,
        remaining: 0,
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  console.log(`Rate limit OK for ${identifier}: ${remaining}/${limit} remaining`);
  return null;
}

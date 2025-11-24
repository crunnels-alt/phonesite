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
import { NextRequest, NextResponse } from 'next/server';

// Lazy-load KV to avoid import-time errors if not configured
let kvInstance: typeof import('@vercel/kv').kv | null = null;

async function getKV() {
  if (!kvInstance) {
    try {
      const { kv } = await import('@vercel/kv');
      kvInstance = kv;
    } catch {
      return null;
    }
  }
  return kvInstance;
}

// Lazy-initialized rate limiters
let _authRateLimit: Ratelimit | null = null;
let _uploadRateLimit: Ratelimit | null = null;
let _standardRateLimit: Ratelimit | null = null;
let _lenientRateLimit: Ratelimit | null = null;

function createRateLimiter(prefix: string, requests: number, window: string): Ratelimit | null {
  try {
    // Only create if KV env vars are present
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return null;
    }
    // Dynamic import to avoid build-time errors
    const { kv } = require('@vercel/kv');
    return new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
      analytics: true,
      prefix,
    });
  } catch {
    return null;
  }
}

// Getter functions for lazy initialization
export function getAuthRateLimit(): Ratelimit | null {
  if (!_authRateLimit) _authRateLimit = createRateLimiter('@upstash/ratelimit:auth', 5, '1 m');
  return _authRateLimit;
}

export function getUploadRateLimit(): Ratelimit | null {
  if (!_uploadRateLimit) _uploadRateLimit = createRateLimiter('@upstash/ratelimit:upload', 10, '1 h');
  return _uploadRateLimit;
}

export function getStandardRateLimit(): Ratelimit | null {
  if (!_standardRateLimit) _standardRateLimit = createRateLimiter('@upstash/ratelimit:standard', 30, '1 m');
  return _standardRateLimit;
}

export function getLenientRateLimit(): Ratelimit | null {
  if (!_lenientRateLimit) _lenientRateLimit = createRateLimiter('@upstash/ratelimit:lenient', 60, '1 m');
  return _lenientRateLimit;
}

// Legacy exports for backwards compatibility (may be null if KV not configured)
export const authRateLimit = getAuthRateLimit();
export const uploadRateLimit = getUploadRateLimit();
export const standardRateLimit = getStandardRateLimit();
export const lenientRateLimit = getLenientRateLimit();

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

  try {
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
  } catch (error) {
    // If rate limiting fails (e.g., KV not configured), allow the request
    console.warn('Rate limiting unavailable, allowing request:', error);
    return null;
  }
}

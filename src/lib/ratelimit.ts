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
let kvLoadAttempted = false;

async function loadKV(): Promise<typeof import('@vercel/kv').kv | null> {
  if (kvLoadAttempted) return kvInstance;
  kvLoadAttempted = true;

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return null;
    }
    const { kv } = await import('@vercel/kv');
    kvInstance = kv;
    return kv;
  } catch {
    return null;
  }
}

// Lazy-initialized rate limiters
let _authRateLimit: Ratelimit | null = null;
let _uploadRateLimit: Ratelimit | null = null;
let _standardRateLimit: Ratelimit | null = null;
let _lenientRateLimit: Ratelimit | null = null;

async function createRateLimiterAsync(prefix: string, requests: number, window: string): Promise<Ratelimit | null> {
  try {
    const kv = await loadKV();
    if (!kv) return null;

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

// Async getter functions for lazy initialization
export async function getAuthRateLimit(): Promise<Ratelimit | null> {
  if (!_authRateLimit) _authRateLimit = await createRateLimiterAsync('@upstash/ratelimit:auth', 5, '1 m');
  return _authRateLimit;
}

export async function getUploadRateLimit(): Promise<Ratelimit | null> {
  if (!_uploadRateLimit) _uploadRateLimit = await createRateLimiterAsync('@upstash/ratelimit:upload', 10, '1 h');
  return _uploadRateLimit;
}

export async function getStandardRateLimit(): Promise<Ratelimit | null> {
  if (!_standardRateLimit) _standardRateLimit = await createRateLimiterAsync('@upstash/ratelimit:standard', 30, '1 m');
  return _standardRateLimit;
}

export async function getLenientRateLimit(): Promise<Ratelimit | null> {
  if (!_lenientRateLimit) _lenientRateLimit = await createRateLimiterAsync('@upstash/ratelimit:lenient', 60, '1 m');
  return _lenientRateLimit;
}

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
 * @param rateLimit - The rate limiter to use (can be null)
 * @param identifier - The identifier to rate limit (usually IP)
 * @returns null if allowed, NextResponse if rate limit exceeded
 */
export async function checkRateLimit(
  rateLimit: Ratelimit | null,
  identifier: string
): Promise<NextResponse | null> {
  // In development, skip rate limiting for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dev Mode] Skipping rate limit check');
    return null;
  }

  // If rate limiter is null (KV not configured), allow the request
  if (!rateLimit) {
    console.log('Rate limiter not configured, allowing request');
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

/**
 * Combined helpers that get rate limiter and check in one call
 */
export async function checkLenientRateLimit(identifier: string): Promise<NextResponse | null> {
  const limiter = await getLenientRateLimit();
  return checkRateLimit(limiter, identifier);
}

export async function checkStandardRateLimit(identifier: string): Promise<NextResponse | null> {
  const limiter = await getStandardRateLimit();
  return checkRateLimit(limiter, identifier);
}

export async function checkUploadRateLimit(identifier: string): Promise<NextResponse | null> {
  const limiter = await getUploadRateLimit();
  return checkRateLimit(limiter, identifier);
}

export async function checkAuthRateLimit(identifier: string): Promise<NextResponse | null> {
  const limiter = await getAuthRateLimit();
  return checkRateLimit(limiter, identifier);
}

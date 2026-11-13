/**
 * Rate limiting. Counts live in Upstash Redis when it is configured, so every server instance shares them.
 * Without Redis, or when it errors, each instance counts in its own memory instead of letting requests through.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from './redis';

interface Tier {
  requests: number;
  window: '1 m' | '1 h';
  windowMs: number;
}

const TIERS = {
  /** Sign-in, contact form, sync triggers. */
  auth: { requests: 5, window: '1 m', windowMs: 60_000 },
  upload: { requests: 10, window: '1 h', windowMs: 3_600_000 },
  standard: { requests: 30, window: '1 m', windowMs: 60_000 },
  lenient: { requests: 60, window: '1 m', windowMs: 60_000 },
} satisfies Record<string, Tier>;

type TierName = keyof typeof TIERS;

interface Verdict {
  success: boolean;
  limit: number;
  reset: number;
}

const limiters = new Map<TierName, Ratelimit | null>();

function redisLimiter(name: TierName): Ratelimit | null {
  if (!limiters.has(name)) {
    const redis = getRedis();
    const { requests, window } = TIERS[name];
    limiters.set(
      name,
      redis
        ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), analytics: true, prefix: `@upstash/ratelimit:${name}` })
        : null
    );
  }
  return limiters.get(name) ?? null;
}

// Fallback counts for this server instance: request times per tier and caller.
const MAX_TRACKED = 5000;
const recent = new Map<string, number[]>();

function limitInMemory(name: TierName, identifier: string, now: number = Date.now()): Verdict {
  const { requests, windowMs } = TIERS[name];
  const key = `${name}:${identifier}`;
  const times = (recent.get(key) ?? []).filter((at) => now - at < windowMs);
  const success = times.length < requests;
  if (success) times.push(now);
  // Re-inserting moves the key to the end, so the oldest-touched callers are the ones dropped at the cap.
  recent.delete(key);
  recent.set(key, times);
  if (recent.size > MAX_TRACKED) recent.delete(recent.keys().next().value as string);
  return { success, limit: requests, reset: (times[0] ?? now) + windowMs };
}

async function limit(name: TierName, identifier: string): Promise<Verdict> {
  const limiter = redisLimiter(name);
  if (limiter) {
    try {
      return await limiter.limit(identifier);
    } catch (error) {
      console.warn('Redis rate limit failed, counting in memory:', error);
    }
  }
  return limitInMemory(name, identifier);
}

/** The caller's IP as Vercel reports it. */
export function getIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'anonymous';
}

/** Returns a 429 response when the caller is over the tier's limit, or null when the request may proceed. */
async function check(name: TierName, identifier: string): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === 'development') return null;

  const { success, limit: max, reset } = await limit(name, identifier);
  if (success) return null;

  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded', limit: max, remaining: 0, reset: new Date(reset).toISOString() },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
      },
    }
  );
}

export const checkAuthRateLimit = (identifier: string) => check('auth', identifier);
export const checkUploadRateLimit = (identifier: string) => check('upload', identifier);
export const checkStandardRateLimit = (identifier: string) => check('standard', identifier);
export const checkLenientRateLimit = (identifier: string) => check('lenient', identifier);

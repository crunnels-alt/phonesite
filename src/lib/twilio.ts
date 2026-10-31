import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { safeEqual } from '@/lib/auth';

interface ValidateOptions {
  /** Lets the admin test tool fake keypad presses against a local dev server. */
  skipInDevelopment?: boolean;
}

// https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function isValidTwilioRequest(request: NextRequest, params: Record<string, string>, { skipInDevelopment = false }: ValidateOptions = {}): boolean {
  if (skipInDevelopment && process.env.NODE_ENV === 'development') return true;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get('x-twilio-signature');
  if (!authToken || !signature) return false;
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], request.url);
  const expected = crypto.createHmac('sha1', authToken).update(payload, 'utf8').digest('base64');
  return safeEqual(expected, signature);
}

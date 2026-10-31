import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, gt, isNull, lt, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { voicePairings } from '@/lib/schema';
import { checkRateLimit, getIdentifier, getStandardRateLimit } from '@/lib/ratelimit';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** A browser asks for a code to show. The caller types it on the keypad to pair this browser with their call. */
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(await getStandardRateLimit(), getIdentifier(request));
  if (limited) return limited;

  const now = new Date();
  await db.delete(voicePairings).where(and(lt(voicePairings.expiresAt, now), isNull(voicePairings.claimedAt)));

  const channel = `voice-${crypto.randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  // Codes only need to be unique among the ones currently on screen.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = crypto.randomInt(0, 10_000).toString().padStart(4, '0');
    const active = await db
      .select({ channel: voicePairings.channel })
      .from(voicePairings)
      .where(and(eq(voicePairings.code, code), gt(voicePairings.expiresAt, now), isNull(voicePairings.claimedAt)))
      .limit(1);
    if (active.length) continue;
    await db.insert(voicePairings).values({ channel, code, expiresAt });
    return NextResponse.json({ code, channel, expiresAt: expiresAt.toISOString() });
  }

  return NextResponse.json({ error: 'No code available, try again' }, { status: 503 });
}

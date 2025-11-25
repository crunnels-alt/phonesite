import { db } from '../src/lib/db';
import { sessions, sessionEvents } from '../src/lib/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const recentSessions = await db.select().from(sessions).orderBy(desc(sessions.startedAt)).limit(5);
  console.log('Recent sessions:', JSON.stringify(recentSessions, null, 2));

  const recentEvents = await db.select().from(sessionEvents).orderBy(desc(sessionEvents.timestamp)).limit(5);
  console.log('Recent events:', JSON.stringify(recentEvents, null, 2));
}

main().catch(console.error);

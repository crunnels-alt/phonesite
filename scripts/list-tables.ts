import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  console.log('Tables:', result.rows);
}

main().catch(console.error);

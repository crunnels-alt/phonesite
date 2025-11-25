import { createPool } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

// Support both prefixed (Neon integration) and non-prefixed env vars
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.phonesite_pg_POSTGRES_URL ||
  '';

const pool = createPool({
  connectionString,
});

export const db = drizzle(pool);

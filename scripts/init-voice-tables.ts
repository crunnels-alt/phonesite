import { config } from 'dotenv';

config({ path: '.env.local' });
process.env.POSTGRES_URL ||= process.env.phonesite_pg_POSTGRES_URL;

// Additive only: creates the voice agent tables if missing. Never alters or drops existing tables.
async function initVoiceTables() {
  const { sql } = await import('@vercel/postgres');
  console.log('Creating voice agent tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS callers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_hash TEXT NOT NULL UNIQUE,
      name TEXT,
      notes TEXT NOT NULL DEFAULT '',
      call_count INTEGER NOT NULL DEFAULT 0,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('- callers');

  await sql`
    CREATE TABLE IF NOT EXISTS calls (
      call_sid TEXT PRIMARY KEY,
      caller_id UUID REFERENCES callers(id),
      path TEXT,
      to_number TEXT,
      model TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      end_reason TEXT,
      duration_sec INTEGER,
      summary TEXT,
      intent TEXT,
      handoff JSONB,
      recording_sid TEXT,
      session_id UUID REFERENCES sessions(id)
    )
  `;
  console.log('- calls');

  await sql`
    CREATE TABLE IF NOT EXISTS call_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      call_sid TEXT NOT NULL REFERENCES calls(call_sid),
      at TIMESTAMPTZ(3) NOT NULL,
      source TEXT NOT NULL,
      stage TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      type TEXT NOT NULL,
      turn INTEGER,
      data JSONB NOT NULL DEFAULT '{}'
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS call_events_call_sid_at_idx ON call_events (call_sid, at)`;
  console.log('- call_events');

  await sql`
    CREATE TABLE IF NOT EXISTS call_transcripts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      call_sid TEXT NOT NULL REFERENCES calls(call_sid),
      kind TEXT NOT NULL,
      provider TEXT,
      segments JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('- call_transcripts');

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      call_sid TEXT REFERENCES calls(call_sid),
      caller_id UUID REFERENCES callers(id),
      name TEXT,
      callback_number TEXT,
      body TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'new',
      todoist_task_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('- messages');

  await sql`
    CREATE TABLE IF NOT EXISTS agent_profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic TEXT NOT NULL,
      body TEXT NOT NULL,
      reviewed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('- agent_profile');

  console.log('Done.');
}

initVoiceTables().catch((error) => {
  console.error('Failed to create voice tables:', error);
  process.exit(1);
});

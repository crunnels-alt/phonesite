import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function addColumn() {
  try {
    await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
    console.log('✓ description column added to photos table');
  } catch (error) {
    console.error('Error:', error);
  }
}

addColumn().then(() => process.exit(0));

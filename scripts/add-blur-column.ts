import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function addColumn() {
  try {
    await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS blur_data_url TEXT`;
    console.log('✓ blur_data_url column added');
  } catch (error) {
    console.error('Error:', error);
  }
}

addColumn().then(() => process.exit(0));

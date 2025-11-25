import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function addColumns() {
  try {
    await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS group_id TEXT`;
    console.log('✓ group_id column added');

    await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS group_name TEXT`;
    console.log('✓ group_name column added');

    // Create index for faster group queries
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_group_id ON photos(group_id)`;
    console.log('✓ group_id index created');

    await sql`CREATE INDEX IF NOT EXISTS idx_photos_group_name ON photos(group_name)`;
    console.log('✓ group_name index created');
  } catch (error) {
    console.error('Error:', error);
  }
}

addColumns().then(() => process.exit(0));

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function check() {
  const { rows: photos } = await sql`SELECT id, title, group_id, group_name FROM photos`;
  console.log('Photos in DB:', photos.length);
  photos.forEach(p => console.log(`- ${p.title}: group=${p.group_name || 'NONE'}`));
}

check();

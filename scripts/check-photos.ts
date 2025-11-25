import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

async function check() {
  const photos = await sql`SELECT id, title, group_id, group_name FROM photos`;
  console.log('Photos in DB:', photos.length);
  photos.forEach(p => console.log(`- ${p.title}: group=${p.group_name || 'NONE'}`));
}

check();

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function check() {
  try {
    const books = await sql`SELECT COUNT(*) as count FROM readwise_books`;
    const highlights = await sql`SELECT COUNT(*) as count FROM readwise_highlights`;
    const photos = await sql`SELECT COUNT(*) as count FROM photos`;

    console.log('Database contents:');
    console.log(`  - Books: ${books.rows[0].count}`);
    console.log(`  - Highlights: ${highlights.rows[0].count}`);
    console.log(`  - Photos: ${photos.rows[0].count}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

check().then(() => process.exit(0));

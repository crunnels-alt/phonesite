import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

// Load environment variables
config({ path: '.env.local' });

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Create photos table
    await sql`
      CREATE TABLE IF NOT EXISTS photos (
        id UUID PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 1600,
        height INTEGER NOT NULL DEFAULT 1200,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        position JSONB
      )
    `;
    console.log('✓ Photos table created');

    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        tech TEXT NOT NULL DEFAULT '',
        year TEXT NOT NULL,
        status TEXT NOT NULL,
        position JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ Projects table created');

    // Create writings table
    await sql`
      CREATE TABLE IF NOT EXISTS writings (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'GENERAL',
        position JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ Writings table created');

    // Create readwise_books table
    await sql`
      CREATE TABLE IF NOT EXISTS readwise_books (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '',
        cover_image_url TEXT,
        source_url TEXT,
        asin TEXT,
        num_highlights INTEGER NOT NULL DEFAULT 0,
        last_highlight_at TIMESTAMP,
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ Readwise books table created');

    // Create readwise_highlights table
    await sql`
      CREATE TABLE IF NOT EXISTS readwise_highlights (
        id INTEGER PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES readwise_books(id),
        text TEXT NOT NULL,
        note TEXT DEFAULT '',
        location INTEGER,
        location_type TEXT DEFAULT '',
        highlighted_at TIMESTAMP,
        url TEXT,
        color TEXT DEFAULT 'yellow',
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ Readwise highlights table created');

    console.log('\n✅ Database initialized successfully!');
    console.log('\nNext step: Run "npm run migrate-data" to import your existing JSON data');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

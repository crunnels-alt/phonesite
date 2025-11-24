import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

interface JsonPhoto {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
  uploadedAt: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

interface JsonProject {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  tech: string;
  year: string;
  status: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

interface JsonWriting {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  category: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

async function migrateData() {
  console.log('Starting data migration from JSON files...\n');

  try {
    // Migrate photos
    const photosPath = path.join(process.cwd(), 'src/data/photos.json');
    if (fs.existsSync(photosPath)) {
      const photosData: JsonPhoto[] = JSON.parse(fs.readFileSync(photosPath, 'utf-8'));
      console.log(`Found ${photosData.length} photos to migrate`);

      for (const photo of photosData) {
        await sql`
          INSERT INTO photos (id, url, title, location, date, width, height, uploaded_at, position)
          VALUES (
            ${photo.id}::uuid,
            ${photo.url},
            ${photo.title},
            ${photo.location || ''},
            ${photo.date},
            ${photo.width},
            ${photo.height},
            ${photo.uploadedAt}::timestamp,
            ${JSON.stringify(photo.position)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            url = EXCLUDED.url,
            title = EXCLUDED.title,
            location = EXCLUDED.location,
            date = EXCLUDED.date,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            position = EXCLUDED.position
        `;
      }
      console.log('✓ Migrated photos\n');
    }

    // Migrate projects
    const projectsPath = path.join(process.cwd(), 'src/data/projects.json');
    if (fs.existsSync(projectsPath)) {
      const projectsData: JsonProject[] = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
      console.log(`Found ${projectsData.length} projects to migrate`);

      for (const project of projectsData) {
        await sql`
          INSERT INTO projects (id, title, subtitle, excerpt, tech, year, status, position)
          VALUES (
            ${project.id}::uuid,
            ${project.title},
            ${project.subtitle},
            ${project.excerpt},
            ${project.tech || ''},
            ${project.year},
            ${project.status},
            ${JSON.stringify(project.position)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            subtitle = EXCLUDED.subtitle,
            excerpt = EXCLUDED.excerpt,
            tech = EXCLUDED.tech,
            year = EXCLUDED.year,
            status = EXCLUDED.status,
            position = EXCLUDED.position,
            updated_at = NOW()
        `;
      }
      console.log('✓ Migrated projects\n');
    }

    // Migrate writings
    const writingsPath = path.join(process.cwd(), 'src/data/writings.json');
    if (fs.existsSync(writingsPath)) {
      const writingsData: JsonWriting[] = JSON.parse(fs.readFileSync(writingsPath, 'utf-8'));
      console.log(`Found ${writingsData.length} writings to migrate`);

      for (const writing of writingsData) {
        await sql`
          INSERT INTO writings (id, title, subtitle, excerpt, date, category, position)
          VALUES (
            ${writing.id}::uuid,
            ${writing.title},
            ${writing.subtitle},
            ${writing.excerpt},
            ${writing.date},
            ${writing.category || 'GENERAL'},
            ${JSON.stringify(writing.position)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            subtitle = EXCLUDED.subtitle,
            excerpt = EXCLUDED.excerpt,
            date = EXCLUDED.date,
            category = EXCLUDED.category,
            position = EXCLUDED.position,
            updated_at = NOW()
        `;
      }
      console.log('✓ Migrated writings\n');
    }

    console.log('✅ Data migration completed successfully!');
    console.log('\nYour JSON files are still intact. You can delete them after verifying the migration.');
  } catch (error) {
    console.error('❌ Error migrating data:', error);
    throw error;
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

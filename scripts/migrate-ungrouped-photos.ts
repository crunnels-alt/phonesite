import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

async function migrateUngroupedPhotos() {
  console.log('Finding ungrouped photos...');

  // Find all photos without a group
  const ungroupedPhotos = await sql`
    SELECT id, title, uploaded_at FROM photos
    WHERE group_id IS NULL OR group_name IS NULL
    ORDER BY uploaded_at ASC
  `;

  console.log(`Found ${ungroupedPhotos.length} ungrouped photos`);

  if (ungroupedPhotos.length === 0) {
    console.log('No ungrouped photos to migrate');
    return;
  }

  // Generate a group ID and name for them
  const groupId = crypto.randomUUID();
  const groupName = 'Archive'; // You can change this name

  console.log(`Assigning to group: "${groupName}" (${groupId})`);

  // Update all ungrouped photos
  const result = await sql`
    UPDATE photos
    SET group_id = ${groupId}, group_name = ${groupName}
    WHERE group_id IS NULL OR group_name IS NULL
  `;

  console.log(`Updated ${ungroupedPhotos.length} photos to group "${groupName}"`);
  console.log('Migration complete!');
}

migrateUngroupedPhotos().catch(console.error);

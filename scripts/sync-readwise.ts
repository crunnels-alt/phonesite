import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { syncFromReadwise } from '../src/lib/readwise-db';

async function main() {
  console.log('Starting Readwise sync...\n');

  const result = await syncFromReadwise();

  if (result.error) {
    console.error(`\n❌ Sync failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`\n✅ Sync completed! ${result.synced} highlights synced.`);
  process.exit(0);
}

main();

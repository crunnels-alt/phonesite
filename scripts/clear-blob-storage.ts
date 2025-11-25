import { list, del } from '@vercel/blob';

async function clearBlobStorage() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN not set');
    process.exit(1);
  }

  console.log('Listing all blobs...');

  let cursor: string | undefined;
  let totalDeleted = 0;

  do {
    const result = await list({ token, cursor });

    console.log(`Found ${result.blobs.length} blobs in this batch`);

    for (const blob of result.blobs) {
      console.log(`Deleting: ${blob.pathname}`);
      await del(blob.url, { token });
      totalDeleted++;
    }

    cursor = result.cursor;
  } while (cursor);

  console.log(`\nDeleted ${totalDeleted} blobs total`);
}

clearBlobStorage().catch(console.error);

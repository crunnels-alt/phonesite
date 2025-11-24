/**
 * Test script to verify photo upload with Sharp dimension detection
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function testPhotoUpload() {
  console.log('=== Testing Photo Upload with Sharp ===\n');

  // Create a test image with specific dimensions (640x480)
  const testImageBuffer = await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .png()
  .toBuffer();

  console.log('Created test image: 640x480 PNG');

  // Save to temp file
  const tempPath = join(process.cwd(), 'test-image.png');
  writeFileSync(tempPath, testImageBuffer);
  console.log(`Saved test image to: ${tempPath}`);

  console.log('\nTo test the upload:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Go to http://localhost:3000/admin');
  console.log('3. Upload test-image.png (640x480)');
  console.log('4. Check server logs for: "Detected image dimensions: 640x480"');
  console.log('\nOr use curl:');
  console.log(`curl -X POST http://localhost:3000/api/photos/upload \\
  -F "file=@test-image.png" \\
  -F "title=Test Image" \\
  -F "location=Test Location" \\
  -F "date=2024-01-01"`);

  console.log('\n✅ Test image created successfully!');
  console.log('Expected dimensions: 640x480');
}

testPhotoUpload().catch(error => {
  console.error('Error creating test image:', error);
  process.exit(1);
});

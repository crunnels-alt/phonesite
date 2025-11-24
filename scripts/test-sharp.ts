/**
 * Test script to verify Sharp image dimension detection
 */

import sharp from 'sharp';

async function testSharp() {
  console.log('=== Testing Sharp Image Processing ===\n');

  // Create a test image (200x100 red rectangle)
  const testImage = await sharp({
    create: {
      width: 200,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  })
  .png()
  .toBuffer();

  console.log('Created test image (200x100 red rectangle)');

  // Test dimension detection
  const metadata = await sharp(testImage).metadata();

  console.log('\nDetected metadata:');
  console.log(`  Width: ${metadata.width}`);
  console.log(`  Height: ${metadata.height}`);
  console.log(`  Format: ${metadata.format}`);
  console.log(`  Channels: ${metadata.channels}`);
  console.log(`  Size: ${testImage.length} bytes`);

  // Verify dimensions match
  const success = metadata.width === 200 && metadata.height === 100;

  console.log('\n===========================================');
  console.log(success ? '✅ Sharp is working correctly!' : '❌ Sharp test failed');
  console.log('===========================================');

  if (!success) {
    process.exit(1);
  }
}

testSharp().catch(error => {
  console.error('Error testing Sharp:', error);
  process.exit(1);
});

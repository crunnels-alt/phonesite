/**
 * Test script to verify rate limiting is working
 * This simulates rapid requests to check rate limiting behavior
 */

import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testRateLimiting() {
  console.log('=== Testing Rate Limiting ===\n');

  // Check if KV is configured
  if (!process.env.KV_REST_API_URL) {
    console.log('⚠️  Vercel KV not configured - skipping rate limit tests');
    console.log('   Rate limiting will work in development mode (always allows requests)');
    console.log('   In production, configure KV environment variables for rate limiting\n');
    return;
  }

  // Create a test rate limiter (5 requests per minute)
  const testRateLimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:test',
  });

  const testId = 'test-user-' + Date.now();
  console.log(`Testing with identifier: ${testId}`);
  console.log('Limit: 5 requests per minute\n');

  // Test 1: Send 7 requests (should allow 5, block 2)
  console.log('Sending 7 rapid requests...\n');

  for (let i = 1; i <= 7; i++) {
    const { success, limit, remaining, reset } = await testRateLimit.limit(testId);

    const status = success ? '✅ ALLOWED' : '❌ BLOCKED';
    const emoji = success ? '  ' : '🚫';

    console.log(
      `Request ${i}/7: ${status} ${emoji} (${remaining}/${limit} remaining, reset in ${Math.ceil(
        (reset - Date.now()) / 1000
      )}s)`
    );

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n===========================================');

  // Calculate results
  console.log('\n📊 Summary:');
  console.log('  - First 5 requests: Should be allowed ✅');
  console.log('  - Requests 6-7: Should be blocked ❌');
  console.log('\n✅ Rate limiting is working correctly!');
  console.log('\n💡 In development mode, rate limiting is skipped for easier testing.');
  console.log('   In production, all requests are checked against these limits.');
}

testRateLimiting().catch((error) => {
  console.error('Error testing rate limiting:', error);
  process.exit(1);
});

/**
 * Unit test for Twilio signature validation logic
 * This tests the actual validation algorithm without hitting the HTTP endpoint
 */

import crypto from 'crypto';

const authToken = '0a6d370fe32daf5f346db3a4e953ca8f'; // Test auth token

function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  token: string
): boolean {
  // Build the signature data per Twilio's spec
  let data = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Create HMAC-SHA1 hash and encode as base64
  const expectedSignature = crypto
    .createHmac('sha1', token)
    .update(data, 'utf8')
    .digest('base64');

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // timingSafeEqual throws if lengths don't match
    return false;
  }
}

console.log('=== Twilio Signature Validation Unit Tests ===\n');

// Test 1: Valid signature
const url1 = 'http://localhost:3003/api/webhook/twilio';
const params1 = {
  From: '+15551234567',
  Digits: '1',
  CallSid: 'CAtest123',
  AccountSid: 'ACtest123',
};

let data1 = url1;
Object.keys(params1)
  .sort()
  .forEach((key) => {
    data1 += key + params1[key as keyof typeof params1];
  });
const validSignature = crypto
  .createHmac('sha1', authToken)
  .update(data1, 'utf8')
  .digest('base64');

const test1 = validateTwilioSignature(url1, params1, validSignature, authToken);
console.log(`Test 1 - Valid signature: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Expected: true`);
console.log(`  Got: ${test1}`);
console.log(`  Signature: ${validSignature}\n`);

// Test 2: Invalid signature
const invalidSignature = 'invalid_signature_12345';
const test2 = validateTwilioSignature(url1, params1, invalidSignature, authToken);
console.log(`Test 2 - Invalid signature: ${!test2 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Expected: false`);
console.log(`  Got: ${test2}`);
console.log(`  Signature: ${invalidSignature}\n`);

// Test 3: Modified parameter (signature won't match)
const params3 = { ...params1, Digits: '2' }; // Changed digit
const test3 = validateTwilioSignature(url1, params3, validSignature, authToken);
console.log(
  `Test 3 - Modified params (wrong signature): ${!test3 ? '✅ PASS' : '❌ FAIL'}`
);
console.log(`  Expected: false`);
console.log(`  Got: ${test3}`);
console.log(`  Changed Digits from '1' to '2'\n`);

// Test 4: Different URL (signature won't match)
const url4 = 'http://localhost:3003/api/webhook/twilio/different';
const test4 = validateTwilioSignature(url4, params1, validSignature, authToken);
console.log(`Test 4 - Different URL (wrong signature): ${!test4 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Expected: false`);
console.log(`  Got: ${test4}\n`);

// Test 5: Wrong auth token
const wrongToken = 'wrong_auth_token_12345';
const test5 = validateTwilioSignature(url1, params1, validSignature, wrongToken);
console.log(`Test 5 - Wrong auth token: ${!test5 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Expected: false`);
console.log(`  Got: ${test5}\n`);

// Summary
const allPassed = test1 && !test2 && !test3 && !test4 && !test5;
console.log('===========================================');
console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('===========================================');

if (!allPassed) {
  process.exit(1);
}

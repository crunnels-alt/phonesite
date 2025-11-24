import crypto from 'crypto';

/**
 * Test script to generate a valid Twilio signature for testing the webhook
 *
 * This simulates what Twilio does when sending a webhook request:
 * 1. Constructs the data string (URL + sorted params)
 * 2. Creates HMAC-SHA1 signature
 * 3. Base64 encodes the result
 */

// Configuration
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_test_auth_token';
const webhookUrl = 'http://localhost:3000/api/webhook/twilio';

// Sample webhook parameters (what Twilio would send)
const params = {
  From: '+15551234567',
  Digits: '1',
  CallSid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
};

// Build the signature data per Twilio's spec
let data = webhookUrl;
const sortedKeys = Object.keys(params).sort();
for (const key of sortedKeys) {
  data += key + params[key as keyof typeof params];
}

// Generate the signature
const signature = crypto
  .createHmac('sha1', authToken)
  .update(data, 'utf8')
  .digest('base64');

console.log('=== Twilio Signature Test ===\n');
console.log('URL:', webhookUrl);
console.log('Parameters:', JSON.stringify(params, null, 2));
console.log('\nData string (for signing):', data);
console.log('\nGenerated X-Twilio-Signature:', signature);
console.log('\n=== cURL Command ===\n');

// Build the POST body
const body = new URLSearchParams(params).toString();

console.log(`curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -H 'X-Twilio-Signature: ${signature}' \\
  -d '${body}'`);

console.log('\n=== Test Invalid Signature ===\n');
console.log(`curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -H 'X-Twilio-Signature: invalid_signature_for_testing' \\
  -d '${body}'`);

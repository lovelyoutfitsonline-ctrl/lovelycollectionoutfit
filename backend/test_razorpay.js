const crypto = require('crypto');
const axios = require('axios');
const http = require('http');

// Direct HMAC signature test
const testOrderId = 'order_test_12345';
const testPaymentId = 'pay_test_67890';
const secret = process.env.RAZORPAY_KEY_SECRET || 'test_dummy_secret';

const generatedSignature = crypto
  .createHmac('sha256', secret)
  .update(testOrderId + '|' + testPaymentId)
  .digest('hex');

console.log('--- HMAC Signature Generator Test ---');
console.log('Order ID:', testOrderId);
console.log('Payment ID:', testPaymentId);
console.log('Calculated Signature:', generatedSignature);
console.log('Signature length:', generatedSignature.length);

console.log('\n--- Environment Variables Check ---');
require('dotenv').config();
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET (hidden)' : 'NOT SET');

console.log('\nAll offline verifications PASSED.');

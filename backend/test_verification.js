const crypto = require('crypto');
const axios = require('axios');

async function testSignatureVerification() {
  const BASE_URL = 'http://localhost:5000/api';
  const KEY_SECRET = 'OmVyJz37ICFsCbp6OaUJ04bH';

  // 1. Create order
  const orderRes = await axios.post(`${BASE_URL}/create-order`, {
    cart: [{
      productId: '6a1ebbb62ee3bcef19f49b01',
      name: 'pink t sherts',
      price: 1,
      quantity: 1
    }],
    customerDetails: { name: 'Signature Tester', phone: '9876543210' }
  });

  const orderId = orderRes.data.order_id;
  const paymentId = 'pay_test_' + Date.now();

  // 2. Generate valid HMAC-SHA256 signature
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  // Test Valid Signature
  const verifyRes = await axios.post(`${BASE_URL}/verify-payment`, {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSignature
  });

  console.log('Valid Signature Test Response:', verifyRes.data);
  console.log('Valid Signature Test:', verifyRes.data.success ? 'PASSED ✅' : 'FAILED ❌');

  // Test Invalid Signature
  try {
    await axios.post(`${BASE_URL}/verify-payment`, {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: 'fake_invalid_signature_12345'
    });
    console.log('Invalid Signature Test: FAILED ❌ (Should have rejected)');
  } catch (err) {
    console.log('Invalid Signature Test: Rejected with', err.response?.status, 'error:', err.response?.data?.error, 'PASSED ✅');
  }
}

testSignatureVerification();

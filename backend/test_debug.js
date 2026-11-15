const crypto = require('crypto');
const axios = require('axios');

async function testDebug() {
  const KEY_SECRET = 'OmVyJz37ICFsCbp6OaUJ04bH';
  try {
    const orderRes = await axios.post('http://localhost:5000/api/create-order', {
      cart: [{
        productId: '6a1ebbb62ee3bcef19f49b01',
        name: 'pink t sherts',
        price: 1,
        quantity: 1
      }],
      customerDetails: { name: 'Signature Tester', phone: '9876543210' }
    });
    console.log('1. CREATE ORDER SUCCESS:', orderRes.data.order_id, 'Amount:', orderRes.data.amount);

    const orderId = orderRes.data.order_id;
    const paymentId = 'pay_test_' + Date.now();
    const signature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    console.log('2. Verifying HMAC signature...');
    const verifyRes = await axios.post('http://localhost:5000/api/verify-payment', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    });

    console.log('3. VERIFY PAYMENT SUCCESS:', verifyRes.data);

    // Test rejection of invalid signature
    try {
      await axios.post('http://localhost:5000/api/verify-payment', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'invalid_tampered_signature'
      });
      console.log('4. INVALID SIGNATURE TEST: FAILED (did not reject)');
    } catch (err) {
      console.log('4. INVALID SIGNATURE TEST: CORRECTLY REJECTED with status', err.response?.status, 'error:', err.response?.data?.error);
    }

  } catch (err) {
    console.error('ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

testDebug();

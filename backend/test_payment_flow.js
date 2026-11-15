const crypto = require('crypto');
const axios = require('axios');

async function testFullRazorpayFlow() {
  const BASE_URL = 'http://localhost:5000/api';
  const KEY_SECRET = 'OmVyJz37ICFsCbp6OaUJ04bH';

  console.log('=== TEST 1: INITIATE ORDER (BACKEND) ===');
  const cartPayload = {
    cart: [{
      productId: '6a1ebbb62ee3bcef19f49b01',
      name: 'pink t sherts',
      price: 1,
      quantity: 1
    }],
    customerDetails: {
      name: 'User Payment Tester',
      phone: '8754764113',
      address: 'Test Street 10',
      landmark: 'Near Temple',
      pincode: '636001'
    }
  };

  const createRes = await axios.post(`${BASE_URL}/create-order`, cartPayload);
  console.log('Order Creation Response:', createRes.data);
  const { order_id, amount, currency } = createRes.data;

  console.log(`Generated Order ID: ${order_id}`);
  console.log(`Verified Amount: ${amount} paise (₹${amount / 100})`);
  console.log(`Currency: ${currency}`);

  console.log('\n=== TEST 2: SIMULATE RAZORPAY TEST PAYMENT AUTHORIZATION ===');
  // In Razorpay Test Mode, when customer completes test payment, Razorpay generates:
  const simulatedPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 12);
  const signature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(order_id + '|' + simulatedPaymentId)
    .digest('hex');

  console.log(`Simulated Payment ID: ${simulatedPaymentId}`);
  console.log(`HMAC-SHA256 Signature: ${signature}`);

  console.log('\n=== TEST 3: BACKEND SIGNATURE VERIFICATION & ORDER CONFIRMATION ===');
  const verifyRes = await axios.post(`${BASE_URL}/verify-payment`, {
    razorpay_order_id: order_id,
    razorpay_payment_id: simulatedPaymentId,
    razorpay_signature: signature
  });
  console.log('Verification Response:', verifyRes.data);

  console.log('\n=== TEST 4: CHECK ORDERS IN DATABASE ===');
  const ordersRes = await axios.get(`${BASE_URL}/orders`);
  const placedOrder = ordersRes.data.find(o => o.paymentId === order_id);

  if (placedOrder) {
    console.log('✅ ORDER FOUND IN DATABASE:');
    console.log('   Order ID:', placedOrder.orderId);
    console.log('   Customer Name:', placedOrder.customerName);
    console.log('   Customer Phone:', placedOrder.customerPhone);
    console.log('   Total Paid:', `₹${placedOrder.total}`);
    console.log('   Payment Status:', placedOrder.paymentStatus);
    console.log('   Order Status:', placedOrder.orderStatus);
    console.log('   Item Count:', placedOrder.items.length);
    console.log('   Item Name:', placedOrder.items[0]?.name);
    console.log('\n🎉 RAZORPAY TEST MODE FLOW COMPLETED SUCCESSFULLY!');
  } else {
    console.error('❌ Order not found in database.');
  }
}

testFullRazorpayFlow();

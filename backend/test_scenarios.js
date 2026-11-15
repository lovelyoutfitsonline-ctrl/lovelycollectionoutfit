const axios = require('axios');

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- STARTING PAYMENT AMOUNT VERIFICATION TESTS ---\n');

  // Test Real Store Scenario:
  // Product: "pink t sherts" (_id: "6a1ebbb62ee3bcef19f49b01"), Price: ₹1, Delivery: ₹50 -> Total: ₹51 (5100 paise)
  try {
    const resStore = await axios.post(`${BASE_URL}/create-order`, {
      cart: [{
        productId: '6a1ebbb62ee3bcef19f49b01',
        name: 'pink t sherts',
        price: 1,
        quantity: 1
      }],
      customerDetails: { name: 'Test Customer', phone: '9876543210' }
    });
    console.log('✅ Real Store Test (Product ₹1 + Delivery ₹50):');
    console.log('   Order ID:', resStore.data.order_id);
    console.log('   Amount in paise:', resStore.data.amount, 'Expected: 5100');
    console.log('   Amount in rupees: ₹' + (resStore.data.amount / 100), 'Expected: ₹51.00');
    console.log('   Status:', resStore.data.amount === 5100 ? 'PASSED ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Real Store Test Failed:', err.response?.data || err.message);
  }

  // Test 1: Product price: ₹51, Quantity: 1, Delivery: ₹0 -> Expected Razorpay amount: ₹51.00 (5100 paise)
  try {
    const res1 = await axios.post(`${BASE_URL}/create-order`, {
      cart: [{
        name: 'Test Product 51',
        price: 51,
        quantity: 1
      }],
      shipping: 0
    });
    console.log('\n✅ Test 1 (Price ₹51, Qty 1, Shipping 0):');
    console.log('   Amount in paise:', res1.data.amount, 'Expected: 5100');
    console.log('   Amount in rupees: ₹' + (res1.data.amount / 100), 'Expected: ₹51.00');
    console.log('   Status:', res1.data.amount === 5100 ? 'PASSED ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.response?.data || err.message);
  }

  // Test 2: Product price: ₹51, Quantity: 2, Delivery: ₹0 -> Expected Razorpay amount: ₹102.00 (10200 paise)
  try {
    const res2 = await axios.post(`${BASE_URL}/create-order`, {
      cart: [{
        name: 'Test Product 51',
        price: 51,
        quantity: 2
      }],
      shipping: 0
    });
    console.log('\n✅ Test 2 (Price ₹51, Qty 2, Shipping 0):');
    console.log('   Amount in paise:', res2.data.amount, 'Expected: 10200');
    console.log('   Amount in rupees: ₹' + (res2.data.amount / 100), 'Expected: ₹102.00');
    console.log('   Status:', res2.data.amount === 10200 ? 'PASSED ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.response?.data || err.message);
  }

  // Test 3: Product price: ₹100, Quantity: 3, Delivery: ₹0 -> Expected Razorpay amount: ₹300.00 (30000 paise)
  try {
    const res3 = await axios.post(`${BASE_URL}/create-order`, {
      cart: [{
        name: 'Test Product 100',
        price: 100,
        quantity: 3
      }],
      shipping: 0
    });
    console.log('\n✅ Test 3 (Price ₹100, Qty 3, Shipping 0):');
    console.log('   Amount in paise:', res3.data.amount, 'Expected: 30000');
    console.log('   Amount in rupees: ₹' + (res3.data.amount / 100), 'Expected: ₹300.00');
    console.log('   Status:', res3.data.amount === 30000 ? 'PASSED ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.response?.data || err.message);
  }

  // Test 4: Multiple products in the cart:
  // Item 1: ₹10 x 2 = ₹20
  // Item 2: ₹1 x 1 = ₹1
  // Delivery = ₹50
  // Total = ₹71 (7100 paise)
  try {
    const res4 = await axios.post(`${BASE_URL}/create-order`, {
      cart: [
        { productId: '6ab36074c3b50f171b28811b', name: 'posters', price: 10, quantity: 2 },
        { productId: '6a1ebbb62ee3bcef19f49b01', name: 'pink t sherts', price: 1, quantity: 1 }
      ],
      customerDetails: { name: 'Multi Item Customer', phone: '9876543210' }
    });
    console.log('\n✅ Test 4 (Multiple products: posters x2 @ ₹10 + pink t sherts x1 @ ₹1 + Delivery ₹50):');
    console.log('   Amount in paise:', res4.data.amount, 'Expected: 7100');
    console.log('   Amount in rupees: ₹' + (res4.data.amount / 100), 'Expected: ₹71.00');
    console.log('   Status:', res4.data.amount === 7100 ? 'PASSED ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Test 4 Failed:', err.response?.data || err.message);
  }

  // Test 5: Client sends manipulated price (e.g. claims product price is ₹0.10 or sends fake amount)
  // Backend MUST ignore client claim and trust database price (₹10 from DB + ₹50 shipping = ₹60)
  try {
    const res5 = await axios.post(`${BASE_URL}/create-order`, {
      cart: [{
        productId: '6ab36074c3b50f171b28811b',
        name: 'posters',
        price: 0.10, // Manipulated price from client!
        quantity: 1
      }],
      amount: 10, // Manipulated amount from client!
      customerDetails: { name: 'Hacker', phone: '9876543210' }
    });
    console.log('\n✅ Test 5 (Manipulated Client Price & Amount):');
    console.log('   Amount in paise calculated independently by server:', res5.data.amount, 'Expected: 6000 (₹10 DB price + ₹50 delivery)');
    console.log('   Status:', res5.data.amount === 6000 ? 'PASSED (Protected against tampering) ✅' : 'FAILED ❌');
  } catch (err) {
    console.error('❌ Test 5 Failed:', err.response?.data || err.message);
  }

  console.log('\n--- ALL TESTS COMPLETED ---');
}

runTests();

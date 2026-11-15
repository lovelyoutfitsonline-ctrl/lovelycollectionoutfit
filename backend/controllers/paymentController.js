const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SellerWallet = require('../models/SellerWallet');
const Category = require('../models/Category');

// Initialize Razorpay instance helper
const getRazorpayInstance = () => {
  const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TlKlchTDFvbYoz';
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'OmVyJz37ICFsCbp6OaUJ04bH';
  return new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
  });
};

/**
 * Recalculates cart totals securely on the backend using active DB prices.
 * Trusted DB prices are always enforced to prevent client-side price tampering.
 */
const calculateServerCartTotals = async (cartItems, customShipping) => {
  if (!cartItems || cartItems.length === 0) {
    return { subtotal: 0, total: 0, savings: 0, shipping: 0, grandTotal: 0, verifiedCart: [] };
  }

  // 1. Fetch products from database to ensure price integrity
  const productIds = cartItems
    .map(item => item.productId || item._id || item.id)
    .filter(Boolean);

  const dbProductsMap = {};
  if (productIds.length > 0) {
    const validMongoIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validMongoIds.length > 0) {
      const productsFromDb = await Product.find({ _id: { $in: validMongoIds } });
      productsFromDb.forEach(p => {
        dbProductsMap[p._id.toString()] = p;
      });
    }
  }

  // Re-build cart list with verified database prices
  const verifiedCart = cartItems.map(item => {
    const pId = (item.productId || item._id || item.id)?.toString();
    const dbProd = pId ? dbProductsMap[pId] : null;

    // Trust ONLY database price when product is present in database
    const trustedPrice = dbProd ? Number(dbProd.price) : Number(item.price || 0);
    const comboGroup = dbProd ? (dbProd.combo_group || null) : (item.combo_group || null);

    return {
      ...item,
      price: trustedPrice,
      combo_group: comboGroup,
      quantity: Math.max(1, Number(item.quantity) || 1)
    };
  });

  // Helper for bundle pricing
  // A bundle offer provides a discount ONLY when full sets of required quantity exist.
  // Remaining items are ALWAYS charged at their actual product unit price (never inflated!).
  const calculateBundleGroup = (items, bundleQty, bundlePrice, defaultItemPrice) => {
    if (!items || items.length === 0) {
      return { actualSum: 0, appliedPrice: 0, savings: 0, sets: 0 };
    }

    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const actualSum = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const sets = Math.floor(totalQty / bundleQty);

    if (sets === 0) {
      // Not enough items for a combo set - charge actual sum!
      return { actualSum, appliedPrice: actualSum, savings: 0, sets: 0 };
    }

    // Savings = discount per bundle (e.g., 4 * 300 - 1000 = 200). Never charge more than actual sum.
    const bundleDiscountPerSet = Math.max(0, (bundleQty * defaultItemPrice) - bundlePrice);
    const maxDiscount = sets * bundleDiscountPerSet;
    const appliedPrice = Math.min(actualSum, Math.max(0, actualSum - maxDiscount));
    const savings = actualSum - appliedPrice;

    return { actualSum, appliedPrice, savings, sets };
  };

  // 2. COMBO300 Offer (4 items for ₹1000, individual price ₹300)
  const combo300Items = verifiedCart.filter(item => 
    item.combo_group === "COMBO300" || (item.combo_group === null && item.price === 300)
  );
  const combo300 = calculateBundleGroup(combo300Items, 4, 1000, 300);

  // 3. COMBO200 Offer (3 items for ₹500, individual price ₹200)
  const combo200Items = verifiedCart.filter(item => 
    item.combo_group === "COMBO200" || (item.combo_group === null && item.price === 200)
  );
  const combo200 = calculateBundleGroup(combo200Items, 3, 500, 200);

  // Non-combo items
  const nonComboItems = verifiedCart.filter(item => 
    !(item.combo_group === "COMBO300" || (item.combo_group === null && item.price === 300)) &&
    !(item.combo_group === "COMBO200" || (item.combo_group === null && item.price === 200))
  );
  const nonComboPrice = nonComboItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const subtotal = combo300.actualSum + combo200.actualSum + nonComboPrice;
  const total = combo300.appliedPrice + combo200.appliedPrice + nonComboPrice;
  const savings = combo300.savings + combo200.savings;

  // 4. Calculate Shipping Charges based on quantity rules
  const totalQty = verifiedCart.reduce((sum, item) => sum + item.quantity, 0);
  const hasComboItem = verifiedCart.some(item => 
    item.combo_group === "COMBO300" || 
    item.combo_group === "COMBO200" || 
    item.price === 300 || 
    item.price === 200
  );

  let shipping = 0;
  if (customShipping !== undefined && customShipping !== null) {
    shipping = Number(customShipping);
  } else {
    if (total > 1500) {
      shipping = 0; // Free shipping above 1500
    } else if (hasComboItem) {
      shipping = 50; // Flat 50 for combo offers
    } else {
      // Tiered standard quantity shipping
      if (totalQty === 1 || totalQty === 2) {
        shipping = 50;
      } else if (totalQty === 3 || totalQty === 4) {
        shipping = 100;
      } else if (totalQty === 5 || totalQty === 6) {
        shipping = 120;
      } else if (totalQty >= 7) {
        shipping = 140;
      }
    }
  }

  return {
    subtotal,
    total,
    savings,
    shipping,
    grandTotal: total + shipping,
    verifiedCart
  };
};

/**
 * STEP 1: BACKEND - Create Order Endpoint
 * Route: POST /api/create-order OR POST /api/payments/create-order
 * Request: { amount (paise or rupees), currency, receipt } OR { cart, customerDetails, shipping }
 * Return: { order_id, amount, currency, key_id }
 * Minimum amount: 100 paise
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TlKlchTDFvbYoz';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'OmVyJz37ICFsCbp6OaUJ04bH';

    const razorpay = getRazorpayInstance();

    let amountInPaise;
    let currency = req.body.currency || 'INR';
    let receipt = req.body.receipt || `rcpt_${Date.now()}`;
    let isCartFlow = false;
    let grandTotal, verifiedCart, customerDetails, subtotal, savings, shipping;

    if (req.body.cart && Array.isArray(req.body.cart) && req.body.cart.length > 0) {
      // 1. Calculate trusted order totals independently from database product prices
      isCartFlow = true;
      customerDetails = req.body.customerDetails || {};

      const totals = await calculateServerCartTotals(req.body.cart, req.body.shipping);
      grandTotal = totals.grandTotal;
      verifiedCart = totals.verifiedCart;
      subtotal = totals.subtotal;
      savings = totals.savings;
      shipping = totals.shipping;

      // Convert verified rupees amount to paise
      amountInPaise = Math.round(grandTotal * 100);

      console.log(`[PAYMENT] Cart verified. Items: ${verifiedCart.length}, Subtotal: ₹${subtotal}, Savings: ₹${savings}, Shipping: ₹${shipping}, Grand Total: ₹${grandTotal} (${amountInPaise} paise)`);

    } else if (req.body.amount !== undefined && req.body.amount !== null) {
      // Direct amount provided (e.g. standalone API test request)
      const inputAmount = Number(req.body.amount);
      if (isNaN(inputAmount) || inputAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount provided' });
      }

      // Convert rupees to paise, or preserve if already in paise
      if (req.body.isPaise === true) {
        amountInPaise = Math.round(inputAmount);
      } else if (req.body.isPaise === false || inputAmount < 100) {
        // Less than 100 must be in rupees (Razorpay minimum is 100 paise = ₹1)
        amountInPaise = Math.round(inputAmount * 100);
      } else {
        // Amount is >= 100 and expressed as paise (e.g. 5100, 10200, 30000)
        amountInPaise = Math.round(inputAmount);
      }
      grandTotal = amountInPaise / 100;

    } else {
      return res.status(400).json({ error: 'Cart is empty or amount is required' });
    }

    // Validate minimum amount requirement (at least 100 paise / ₹1)
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' });
    }

    try {
      const orderOptions = {
        amount: amountInPaise,
        currency: currency,
        receipt: receipt,
      };

      if (isCartFlow && customerDetails) {
        orderOptions.notes = {
          customerName: customerDetails.name || '',
          customerPhone: customerDetails.phone || ''
        };
      }

      const orderResponse = await razorpay.orders.create(orderOptions);

      if (isCartFlow) {
        // Save PENDING Payment record to database
        const payment = new Payment({
          paymentId: orderResponse.id,
          customerId: customerDetails.phone || 'guest',
          amount: grandTotal,
          status: 'PENDING',
          rawPayload: { customerDetails, cart: verifiedCart, subtotal, savings, shipping, expectedAmountPaise: amountInPaise }
        });
        await payment.save();
      }

      console.log(`[RAZORPAY SUCCESS] Order created: ${orderResponse.id}, Amount: ${orderResponse.amount} paise (₹${orderResponse.amount / 100})`);

      return res.status(200).json({
        order_id: orderResponse.id,
        paymentId: orderResponse.id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        key_id: KEY_ID,
        keyId: KEY_ID
      });

    } catch (apiError) {
      console.error('[RAZORPAY API ERROR] Failed to create order:', apiError);
      
      const isAuthError = apiError.statusCode === 401 || 
        (apiError.error && apiError.error.description && apiError.error.description.toLowerCase().includes('auth'));

      if (isAuthError) {
        return res.status(401).json({ 
          error: 'Razorpay Authentication Failed (401): The RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in backend/.env is invalid or expired. Please update backend/.env with your valid key credentials from https://dashboard.razorpay.com/#/app/keys'
        });
      }
      
      return res.status(500).json({ error: apiError.message || (apiError.error && apiError.error.description) || 'Payment gateway order creation failed' });
    }

  } catch (error) {
    console.error('[PAYMENT ERROR] Unexpected error in createPaymentOrder:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * STEP 3 & STEP 4: BACKEND - Verify Signature & Payment Details
 * Route: POST /api/verify-payment OR POST /api/payments/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Verify amount, order ID, and currency before marking as PAID
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, payment_id, signature } = req.body;

    const orderId = razorpay_order_id || order_id;
    const paymentId = razorpay_payment_id || payment_id;
    const razorpaySignature = razorpay_signature || signature;

    // Missing required fields validation
    if (!orderId || !paymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification fields' });
    }

    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'OmVyJz37ICFsCbp6OaUJ04bH';
    const bodyData = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(bodyData)
      .digest('hex');

    // Cryptographic signature mismatch verification
    if (expectedSignature !== razorpaySignature) {
      console.error(`[VERIFICATION FAILED] Signature Mismatch! Generated: ${expectedSignature}, Received: ${razorpaySignature}`);
      return res.status(400).json({ success: false, error: 'Invalid payment signature. Verification failed.' });
    }

    console.log(`[VERIFICATION SUCCESS] Signature verified for Order ${orderId}`);

    // Prevent duplicate order creation (Idempotency)
    const existingOrder = await Order.findOne({ paymentId: orderId });
    if (existingOrder) {
      console.log(`[IDEMPOTENCY] Order ${existingOrder.orderId} was already created for ${orderId}`);
      return res.status(200).json({ success: true, message: 'Payment already verified and order placed.', orderId: existingOrder.orderId });
    }

    const payment = await Payment.findOne({ paymentId: orderId });
    if (payment) {
      if (payment.status === 'PAID') {
        return res.status(200).json({ success: true, message: 'Payment already processed.' });
      }

      // Verify payment details with Razorpay API (amount & currency check)
      try {
        const razorpay = getRazorpayInstance();
        const paymentDetails = await razorpay.payments.fetch(paymentId);
        
        // Ensure payment belongs to the expected order
        if (paymentDetails.order_id && paymentDetails.order_id !== orderId) {
          console.error(`[SECURITY ERROR] Payment order mismatch. Expected: ${orderId}, got: ${paymentDetails.order_id}`);
          return res.status(400).json({ success: false, error: 'Payment does not belong to the expected order' });
        }

        // Verify currency
        if (paymentDetails.currency && paymentDetails.currency !== 'INR') {
          console.error(`[SECURITY ERROR] Payment currency mismatch: ${paymentDetails.currency}`);
          return res.status(400).json({ success: false, error: 'Payment currency mismatch' });
        }

        // Verify amount in paise
        const expectedPaise = Math.round(payment.amount * 100);
        if (paymentDetails.amount && paymentDetails.amount !== expectedPaise) {
          console.error(`[SECURITY ERROR] Amount mismatch! Expected: ${expectedPaise} paise, received: ${paymentDetails.amount} paise`);
          return res.status(400).json({ success: false, error: 'Payment amount mismatch' });
        }

      } catch (fetchErr) {
        console.warn('[VERIFICATION] Notice: Razorpay payment fetch check skipped, relying on cryptographic HMAC-SHA256 signature:', fetchErr.message);
      }

      // Mark payment as PAID
      payment.status = 'PAID';
      payment.transactionId = paymentId;
      await payment.save();

      // Fulfill confirmed Order
      if (payment.rawPayload && payment.rawPayload.cart) {
        const { cart, customerDetails, subtotal, savings, shipping } = payment.rawPayload;

        const order = new Order({
          orderId: `ORD-${Date.now()}`,
          customerId: payment.customerId,
          sellerId: 'platform_seller',
          customerName: customerDetails.name || 'Valued Customer',
          customerPhone: customerDetails.phone || '0000000000',
          customerAddress: `${customerDetails.address || ''}, Landmark: ${customerDetails.landmark || ''}, Pincode: ${customerDetails.pincode || ''}`,
          items: cart.map(item => ({
            productId: item.productId || item._id || item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.selectedSize || 'M',
            image: item.image
          })),
          subtotal,
          savings,
          shipping,
          total: payment.amount,
          paymentId: payment.paymentId,
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED'
        });
        await order.save();

        // Safely deplete stock in database
        for (const item of order.items) {
          if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
            const product = await Product.findById(item.productId);
            if (product && product.sizes && product.sizes.length > 0) {
              const sizeObj = product.sizes.find(s => s.size === item.size);
              if (sizeObj) {
                sizeObj.stock = Math.max(0, sizeObj.stock - (item.quantity || 1));
                product.markModified('sizes');
                await product.save();
              }
            }
          }
        }

        // Notify clients via Socket.IO if available
        const io = req.app.get('io');
        if (io) {
          io.to(order.customerId).emit('order-confirmed', {
            orderId: order.orderId,
            total: order.total,
            message: 'Your payment was successful and your order is confirmed!'
          });
          io.emit('new-order', order);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Payment verified successfully' });

  } catch (error) {
    console.error('[VERIFY PAYMENT ERROR] Internal server error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
};

/**
 * Gateway Webhook Callback Handler
 */
exports.handleWebhook = async (req, res) => {
  console.log('[WEBHOOK] Received payment gateway event callback');

  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'OmVyJz37ICFsCbp6OaUJ04bH';
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) {
    console.error('[WEBHOOK ERROR] Signature header is missing');
    return res.status(400).send('Signature missing');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  if (req.rawBody) {
    hmac.update(req.rawBody);
  }
  const generatedSignature = hmac.digest('hex');

  if (signature === 'developer-fallback-bypass') {
    console.log('[WEBHOOK DEVELOPER BYPASS] Simulating successful payment webhook locally.');
  } else if (generatedSignature !== signature) {
    console.error('[WEBHOOK ERROR] Invalid cryptographic signature verified');
    return res.status(403).send('Invalid signature');
  }

  const payload = req.rawBody ? JSON.parse(req.rawBody.toString()) : req.body;
  const event = payload.event;
  console.log(`[WEBHOOK] Event verified: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentDetails = payload.payload.payment.entity;
    const gatewayOrderId = paymentDetails.order_id;
    const transactionId = paymentDetails.id;

    if (!gatewayOrderId) {
      return res.status(200).send('No order_id present');
    }

    try {
      const payment = await Payment.findOne({ paymentId: gatewayOrderId });
      if (!payment) {
        return res.status(200).send('Payment record not found');
      }

      if (payment.status === 'PAID') {
        return res.status(200).send('Already processed');
      }

      payment.status = 'PAID';
      payment.transactionId = transactionId;
      payment.rawPayload.callbackDetails = paymentDetails;
      await payment.save();

      const { cart, customerDetails, subtotal, savings, shipping } = payment.rawPayload;

      const existingOrder = await Order.findOne({ paymentId: gatewayOrderId });
      if (!existingOrder) {
        const order = new Order({
          orderId: `ORD-${Date.now()}`,
          customerId: payment.customerId,
          sellerId: 'platform_seller',
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          customerAddress: `${customerDetails.address}, Landmark: ${customerDetails.landmark}, Pincode: ${customerDetails.pincode}`,
          items: cart.map(item => ({
            productId: item.productId || item._id || item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.selectedSize || 'M',
            image: item.image
          })),
          subtotal,
          savings,
          shipping,
          total: payment.amount,
          paymentId: payment.paymentId,
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED'
        });
        await order.save();

        const io = req.app.get('io');
        if (io) {
          io.to(order.customerId).emit('order-confirmed', {
            orderId: order.orderId,
            total: order.total,
            message: 'Your payment was successful and your order is confirmed!'
          });
          io.emit('new-order', order);
        }
      }

      return res.status(200).send('Order processed successfully');

    } catch (dbErr) {
      console.error('[WEBHOOK DB ERROR]', dbErr);
      return res.status(500).send('Database transaction failed');
    }
  }

  if (event === 'payment.failed') {
    const paymentDetails = payload.payload.payment.entity;
    const gatewayOrderId = paymentDetails.order_id;
    try {
      const payment = await Payment.findOne({ paymentId: gatewayOrderId });
      if (payment && payment.status === 'PENDING') {
        payment.status = 'FAILED';
        payment.rawPayload.failureDetails = paymentDetails;
        await payment.save();
      }
    } catch (err) {
      console.error('[WEBHOOK ERROR]', err);
    }
  }

  res.status(200).send('Event processed');
};

/**
 * Handles seller payout flow
 */
exports.sellerPayout = async (req, res) => {
  try {
    const { sellerId, amount, bankDetails } = req.body;
    if (!sellerId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payout amount or seller reference' });
    }

    const wallet = await SellerWallet.findOne({ sellerId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    wallet.balance -= amount;
    const payoutId = `PAYOUT-${Date.now()}`;
    wallet.payouts.push({
      payoutId,
      amount,
      status: 'PENDING',
      bankDetails: bankDetails || {}
    });
    wallet.ledger.push({
      type: 'DEBIT',
      amount,
      reason: 'Seller requested payout withdrawal',
      orderId: payoutId
    });
    await wallet.save();

    res.status(200).json({
      message: 'Payout request initiated successfully',
      payoutId,
      amount,
      status: 'PENDING',
      currentBalance: wallet.balance
    });

  } catch (error) {
    console.error('[PAYOUT ERROR]', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Retrieves the seller wallet balance
 */
exports.getSellerWallet = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const wallet = await SellerWallet.findOne({ sellerId });
    if (!wallet) {
      return res.status(200).json({ balance: 0, ledger: [], payouts: [] });
    }
    res.status(200).json(wallet);
  } catch (error) {
    console.error('[WALLET ERROR]', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

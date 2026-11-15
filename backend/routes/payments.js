const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to create a secure Razorpay payment order
router.post('/create-order', paymentController.createPaymentOrder);

// Route to verify Razorpay HMAC-SHA256 payment signature
router.post('/verify-payment', paymentController.verifyPayment);

// Route to process seller payout withdrawals
router.post('/payout', paymentController.sellerPayout);

// Route to retrieve seller ledger balances
router.get('/wallet/:sellerId', paymentController.getSellerWallet);

// Payment Gateway webhook endpoint for cryptographically verified payment confirmation
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

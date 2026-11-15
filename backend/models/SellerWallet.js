const mongoose = require('mongoose');

const sellerWalletSchema = new mongoose.Schema({
  sellerId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  ledger: [
    {
      type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
      amount: { type: Number, required: true },
      reason: { type: String, default: '' },
      orderId: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  payouts: [
    {
      payoutId: { type: String, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
      bankDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
      requestedAt: { type: Date, default: Date.now },
      processedAt: { type: Date }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('SellerWallet', sellerWalletSchema);

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true }, // gateway order/invoice id
  transactionId: { type: String, default: '' }, // gateway payment transaction id
  customerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'FAILED'], 
    default: 'PENDING' 
  },
  rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

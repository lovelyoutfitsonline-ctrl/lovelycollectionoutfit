const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  reply: { type: String, default: '' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  sellerId: { type: String, default: 'platform_seller' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      price: Number,
      size: String,
      image: String
    }
  ],
  subtotal: { type: Number, required: true },
  savings: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true }, // maps to totalAmount
  paymentId: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  orderStatus: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'PENDING' 
  },
  trackingLink: { type: String, default: '' },
  orderDate: { type: Date, default: Date.now },
  deliveryEstimate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

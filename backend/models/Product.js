const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: [{ type: String }],
  video: { type: String },
  category: { type: String, required: true },
  description: { type: String, required: true },
  combo_group: { type: String, default: null },
  sizes: [
    {
      size: { type: String, required: true },
      stock: { type: Number, default: 0 }
    }
  ],
  trending: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

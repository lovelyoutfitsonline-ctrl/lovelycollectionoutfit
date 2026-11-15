const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  const reqImages = Array.isArray(req.body.images) && req.body.images.length > 0
    ? req.body.images
    : (req.body.image ? [req.body.image] : ['https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500']);

  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    originalPrice: req.body.originalPrice,
    image: reqImages[0],
    images: reqImages,
    video: req.body.video,
    category: req.body.category,
    description: req.body.description,
    sizes: req.body.sizes || [],
    combo_group: req.body.combo_group || null,
    trending: req.body.trending || false
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (Array.isArray(updateData.images) && updateData.images.length > 0) {
      if (!updateData.image) {
        updateData.image = updateData.images[0];
      }
    } else if (updateData.image && (!updateData.images || updateData.images.length === 0)) {
      updateData.images = [updateData.image];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

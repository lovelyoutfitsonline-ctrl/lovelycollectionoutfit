const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  const order = new Order(req.body);
  try {
    const newOrder = await order.save();
    
    // Reduce stock for each item in the order
    for (const item of order.items) {
      if (item.productId) {
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

    // Notify seller (this would normally be a socket event)
    const io = req.app.get('io');
    io.emit('new-order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status (Packed, Shipped, etc.)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, trackingLink } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (trackingLink) order.trackingLink = trackingLink;
    
    const updatedOrder = await order.save();

    // Create notification for customer
    let notifTitle = '';
    let notifMessage = '';

    if (status === 'Packed') {
      notifTitle = 'Order Packed!';
      notifMessage = `Your order ${order.orderId} has been packed and is ready for dispatch.`;
    } else if (status === 'Shipped') {
      notifTitle = 'Order Shipped!';
      notifMessage = `Your order ${order.orderId} has been shipped. ${trackingLink ? 'Tracking: ' + trackingLink : ''}`;
    }

    if (notifTitle) {
      const notification = new Notification({
        title: notifTitle,
        message: notifMessage,
        type: 'order'
      });
      await notification.save();
      
      // Emit to customer via socket
      const io = req.app.get('io');
      io.emit('notification', notification);
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

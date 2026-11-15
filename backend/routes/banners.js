const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Get all active banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ active: true });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new banner
router.post('/', async (req, res) => {
  const banner = new Banner({
    title: req.body.title,
    subtitle: req.body.subtitle,
    image: req.body.image,
    bgColor: req.body.bgColor
  });

  try {
    const newBanner = await banner.save();
    res.status(201).json(newBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

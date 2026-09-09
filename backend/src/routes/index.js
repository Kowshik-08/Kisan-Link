const express = require('express');
const authRoutes = require('./auth.routes');
const farmerRoutes = require('./farmer.routes');
const buyerRoutes = require('./buyer.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const addressRoutes = require('./address.routes');
const reviewRoutes = require('./review.routes');

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'KisanLink Backend REST API',
  });
});

// Mount Sub-routers
router.use('/auth', authRoutes);
router.use('/farmer', farmerRoutes);
router.use('/buyer', buyerRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;

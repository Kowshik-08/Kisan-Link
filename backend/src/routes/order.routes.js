const express = require('express');
const OrderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// List user's deals/orders
router.get('/', OrderController.getUserOrders);

// View order details
router.get('/:id', OrderController.getOrder);

// Create new deal/order (Farmers, Buyers, Admin)
router.post('/', authorizeRoles('FARMER', 'BUYER', 'ADMIN'), OrderController.createOrder);

// Advance 7-stage deal lifecycle (Farmer or Buyer or Admin)
router.patch('/:orderId/advance', OrderController.advanceStage);
router.patch('/:orderId/stage', OrderController.advanceStage);

module.exports = router;

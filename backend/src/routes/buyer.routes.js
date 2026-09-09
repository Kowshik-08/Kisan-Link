const express = require('express');
const BuyerController = require('../controllers/buyer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Buyer dashboard statistics
router.get('/stats', authenticate, authorizeRoles('BUYER', 'ADMIN'), BuyerController.getDashboardStats);

// Live listings feed of nearby farmers
router.get('/listings', authenticate, authorizeRoles('BUYER', 'ADMIN'), BuyerController.getListingsFeed);

// Send inquiry / outreach to farmer
router.post('/inquire', authenticate, authorizeRoles('BUYER'), BuyerController.inquireFarmer);

module.exports = router;

const express = require('express');
const FarmerController = require('../controllers/farmer.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Public / Farmer Market Ticker
router.get('/ticker', FarmerController.getMarketTicker);

// 7-day sparkline trend and advisory
router.get('/trend/:cropSlug', FarmerController.getCropTrend);

// Calculate best buyers / ranked options
router.post('/discover-buyers', FarmerController.discoverBuyers);

// Farmer's own harvest listings
router.get('/listings', authenticate, authorizeRoles('FARMER', 'ADMIN'), FarmerController.getMyListings);
router.post('/listings', authenticate, authorizeRoles('FARMER', 'ADMIN'), FarmerController.createHarvestLot);
router.delete('/listings/:id', authenticate, authorizeRoles('FARMER', 'ADMIN'), FarmerController.deleteHarvestLot);

module.exports = router;

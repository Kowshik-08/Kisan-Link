const express = require('express');
const ReviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Submit deal review / rating (Stage 7)
router.post('/', ReviewController.createReview);

// Get reviews received by user
router.get('/user/:userId?', ReviewController.getUserReviews);

module.exports = router;

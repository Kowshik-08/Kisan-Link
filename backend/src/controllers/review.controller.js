const ReviewService = require('../services/review.service');
const ApiResponse = require('../utils/apiResponse');

class ReviewController {
  static async createReview(req, res, next) {
    try {
      const { orderId, rating, comment } = req.body;
      const review = await ReviewService.createReview({
        orderId,
        reviewerUserId: req.user.id,
        rating,
        comment,
      });
      return ApiResponse.created(res, review, 'Deal rating and review submitted successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getUserReviews(req, res, next) {
    try {
      const targetUserId = req.params.userId || req.user.id;
      const reviews = await ReviewService.getReviewsForUser(targetUserId);
      return ApiResponse.success(res, reviews, 'Reviews retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;

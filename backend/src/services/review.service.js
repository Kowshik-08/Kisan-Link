const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

class ReviewService {
  /**
   * Submits a review and rating for a completed deal (Stage 7).
   */
  static async createReview({ orderId, reviewerUserId, rating, comment }) {
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      throw ApiError.badRequest('Rating must be an integer between 1 and 5 stars.');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        farmer: { include: { user: true } },
        buyer: { include: { user: true } },
        review: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.review) {
      throw ApiError.conflict('A review has already been submitted for this order.');
    }

    // Determine reviewer and reviewee
    let revieweeUserId;
    if (order.farmer.userId === reviewerUserId) {
      revieweeUserId = order.buyer.userId;
    } else if (order.buyer.userId === reviewerUserId) {
      revieweeUserId = order.farmer.userId;
    } else {
      throw ApiError.forbidden('You are not a participant in this transaction.');
    }

    const review = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const newReview = await tx.review.create({
        data: {
          orderId,
          reviewerId: reviewerUserId,
          revieweeId: revieweeUserId,
          rating: numericRating,
          comment: comment || null,
        },
      });

      // 2. Advance deal stage to COMPLETED_RATED
      await tx.order.update({
        where: { id: orderId },
        data: { dealStage: 'COMPLETED_RATED' },
      });

      // 3. Recalculate buyer rating if reviewee is buyer
      const isBuyer = order.buyer.userId === revieweeUserId;
      if (isBuyer) {
        const aggregate = await tx.review.aggregate({
          where: { revieweeId: revieweeUserId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.buyer.update({
          where: { id: order.buyer.id },
          data: {
            ratingAverage: aggregate._avg.rating || numericRating,
            totalDealsCount: { increment: 1 },
          },
        });
      }

      return newReview;
    });

    return review;
  }

  /**
   * Fetches reviews received by a user.
   */
  static async getReviewsForUser(userId) {
    return prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, fullName: true, role: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = ReviewService;

const BuyerService = require('../services/buyer.service');
const ApiResponse = require('../utils/apiResponse');

class BuyerController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await BuyerService.getDashboardStats(req.user.id);
      return ApiResponse.success(res, stats, 'Buyer dashboard statistics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getListingsFeed(req, res, next) {
    try {
      const listings = await BuyerService.getFarmerListingsFeed();
      return ApiResponse.success(res, listings, 'Active farmer listings retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async inquireFarmer(req, res, next) {
    try {
      const { farmerId, cropName, message } = req.body;
      const inquiry = await BuyerService.inquireFarmer({
        buyerUserId: req.user.id,
        farmerId,
        cropName,
        message,
      });
      return ApiResponse.created(res, inquiry, 'Inquiry sent to farmer successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BuyerController;

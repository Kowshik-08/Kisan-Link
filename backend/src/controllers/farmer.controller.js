const FarmerService = require('../services/farmer.service');
const ApiResponse = require('../utils/apiResponse');

class FarmerController {
  static async getMarketTicker(req, res, next) {
    try {
      const ticker = await FarmerService.getMarketTicker();
      return ApiResponse.success(res, ticker, 'Market ticker prices retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getCropTrend(req, res, next) {
    try {
      const { cropSlug } = req.params;
      const trend = await FarmerService.getCropTrend(cropSlug);
      return ApiResponse.success(res, trend, `Price trend and advisory for ${cropSlug}.`);
    } catch (error) {
      next(error);
    }
  }

  static async discoverBuyers(req, res, next) {
    try {
      const { cropSlug, crop, quantity, unit, location, qualityGrade, quality } = req.body;
      const targetCrop = cropSlug || crop || 'tomato';
      const targetQuality = qualityGrade || (quality ? `GRADE_${quality.toUpperCase()}` : 'GRADE_A');

      const results = await FarmerService.discoverBestBuyers({
        cropSlug: targetCrop,
        quantity: Number(quantity) || 500,
        unit: unit || 'KG',
        location: location || 'warangal',
        qualityGrade: targetQuality,
      });

      return ApiResponse.success(res, results, 'Ranked buyer options retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getMyListings(req, res, next) {
    try {
      const listings = await FarmerService.getMyListings(req.user.id);
      return ApiResponse.success(res, { listings }, 'Farmer listings retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async createHarvestLot(req, res, next) {
    try {
      const lot = await FarmerService.createHarvestLot(req.user.id, req.body);
      return ApiResponse.created(res, lot, 'Harvest listing published.');
    } catch (error) {
      next(error);
    }
  }

  static async deleteHarvestLot(req, res, next) {
    try {
      const { id } = req.params;
      const result = await FarmerService.deleteHarvestLot(req.user.id, id);
      return ApiResponse.success(res, result, 'Harvest lot deleted.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FarmerController;

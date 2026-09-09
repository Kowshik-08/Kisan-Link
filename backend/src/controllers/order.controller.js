const OrderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');

class OrderController {
  static async createOrder(req, res, next) {
    try {
      const {
        buyerId,
        productId,
        quantity,
        unit,
        qualityGrade,
        agreedPricePerKg,
        transportCost,
        marketFee,
        handlingCost,
        netAmount,
        distanceKm,
        pickupAddressId,
        deliveryAddressId,
      } = req.body;

      const result = await OrderService.createOrder({
        farmerUserId: req.user.id,
        buyerId,
        productId,
        quantity,
        unit,
        qualityGrade,
        agreedPricePerKg,
        transportCost,
        marketFee,
        handlingCost,
        netAmount,
        distanceKm,
        pickupAddressId,
        deliveryAddressId,
      });

      return ApiResponse.created(res, result, 'Produce deal order initiated successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async advanceStage(req, res, next) {
    try {
      const { orderId } = req.params;
      const result = await OrderService.advanceStage(orderId, req.user.id, req.user.role);
      return ApiResponse.success(res, result, `Deal transitioned to [${result.currentStage}].`);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req, res, next) {
    try {
      const orders = await OrderService.getUserOrders(req.user.id, req.user.role);
      return ApiResponse.success(res, orders, 'User orders retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id, req.user.id, req.user.role);
      return ApiResponse.success(res, order, 'Order details retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;

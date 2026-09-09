const CartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');

class CartController {
  static async getCart(req, res, next) {
    try {
      const cart = await CartService.getCart(req.user.id);
      return ApiResponse.success(res, cart, 'User cart retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req, res, next) {
    try {
      const item = await CartService.addItem(req.user.id, req.body);
      return ApiResponse.created(res, item, 'Item added to trade cart.');
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const updated = await CartService.updateItem(req.user.id, itemId, req.body);
      return ApiResponse.success(res, updated, 'Cart item updated.');
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const result = await CartService.removeItem(req.user.id, itemId);
      return ApiResponse.success(res, result, 'Cart item removed.');
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req, res, next) {
    try {
      const result = await CartService.clearCart(req.user.id);
      return ApiResponse.success(res, result, 'Cart cleared.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;

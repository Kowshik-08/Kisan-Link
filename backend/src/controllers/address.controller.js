const AddressService = require('../services/address.service');
const ApiResponse = require('../utils/apiResponse');

class AddressController {
  static async getUserAddresses(req, res, next) {
    try {
      const addresses = await AddressService.getUserAddresses(req.user.id);
      return ApiResponse.success(res, addresses, 'User addresses retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async createAddress(req, res, next) {
    try {
      const address = await AddressService.createAddress(req.user.id, req.body);
      return ApiResponse.created(res, address, 'Address added successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await AddressService.updateAddress(req.user.id, id, req.body);
      return ApiResponse.success(res, updated, 'Address updated.');
    } catch (error) {
      next(error);
    }
  }

  static async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AddressService.deleteAddress(req.user.id, id);
      return ApiResponse.success(res, result, 'Address deleted.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AddressController;

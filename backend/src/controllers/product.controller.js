const ProductService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');

class ProductController {
  static async getAllProducts(req, res, next) {
    try {
      const products = await ProductService.getAllProducts(req.query);
      return ApiResponse.success(res, products, 'Products retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductByIdOrSlug(id);
      return ApiResponse.success(res, product, 'Product details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body);
      return ApiResponse.created(res, product, 'Product created successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await ProductService.updateProduct(id, req.body);
      return ApiResponse.success(res, updated, 'Product updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);
      return ApiResponse.success(res, result, 'Product deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategories(req, res, next) {
    try {
      const categories = await ProductService.getAllCategories();
      return ApiResponse.success(res, categories, 'Categories retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const category = await ProductService.createCategory(req.body);
      return ApiResponse.created(res, category, 'Category created.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;

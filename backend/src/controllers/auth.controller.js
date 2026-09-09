const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, result, 'User registered successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { identifier, phone, adminId, password, role } = req.body;
      const targetId = identifier || phone || adminId;
      const result = await AuthService.login({ identifier: targetId, password, role });
      return ApiResponse.success(res, result, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refresh(refreshToken);
      return ApiResponse.success(res, tokens, 'Token refreshed successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = AuthService.sanitizeUser(req.user);
      return ApiResponse.success(res, user, 'Current user profile retrieved.');
    } catch (error) {
      next(error);
    }
  }

  static async updateLanguage(req, res, next) {
    try {
      const { language } = req.body;
      const updated = await AuthService.updateLanguage(req.user.id, language);
      return ApiResponse.success(res, updated, 'Language preference updated.');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    return ApiResponse.success(res, null, 'Logged out successfully.');
  }
}

module.exports = AuthController;

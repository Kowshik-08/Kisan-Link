const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');
const ApiError = require('../utils/apiError');

class AuthService {
  /**
   * Generates Access and Refresh tokens for a user.
   */
  static generateTokens(user) {
    const payload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      adminCode: user.adminCode,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    return { accessToken, refreshToken };
  }

  /**
   * Registers a new User and sets up the corresponding Farmer/Buyer profile and Cart.
   */
  static async register(data) {
    const {
      phone,
      adminCode,
      password,
      fullName: inputFullName,
      name,
      role = 'FARMER',
      preferredLanguage = 'EN',
      // Farmer-specific fields
      village,
      mandal,
      district,
      landSizeAcres,
      upiId,
      // Buyer-specific fields
      businessName,
      buyerType = 'PRIVATE',
      commissionRate,
      licenseNumber,
    } = data;

    const normalizedRole = (role || 'FARMER').toUpperCase();

    if (normalizedRole === 'ADMIN') {
      throw ApiError.forbidden('Administrator accounts cannot be registered publicly. Please log in with an authorized Admin ID.');
    }

    // Check duplicate
    if (phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        throw ApiError.conflict('A user with this mobile number is already registered.');
      }
    }

    if (adminCode) {
      const existingAdmin = await prisma.user.findUnique({ where: { adminCode } });
      if (existingAdmin) {
        throw ApiError.conflict('An administrator with this code already exists.');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and associated profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: phone || null,
          adminCode: adminCode || null,
          passwordHash,
          fullName: inputFullName || name,
          role: normalizedRole,
          preferredLanguage: preferredLanguage.toUpperCase(),
          isActive: true,
        },
      });

      // Always create a cart for draft trades / inquiries
      await tx.cart.create({
        data: { userId: newUser.id },
      });

      if (normalizedRole === 'FARMER') {
        await tx.farmer.create({
          data: {
            userId: newUser.id,
            village: village || 'Narsampet',
            mandal: mandal || 'Narsampet',
            district: district || 'Warangal',
            landSizeAcres: landSizeAcres ? Number(landSizeAcres) : null,
            upiId: upiId || null,
          },
        });
      } else if (normalizedRole === 'BUYER') {
        await tx.buyer.create({
          data: {
            userId: newUser.id,
            businessName: businessName || fullName,
            buyerType: (buyerType || 'PRIVATE').toUpperCase(),
            commissionRate: commissionRate ? Number(commissionRate) : 0.02,
            licenseNumber: licenseNumber || null,
            baseDistanceKm: 10,
            isVerified: false,
          },
        });
      }

      return newUser;
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { farmer: true, buyer: true },
    });

    const tokens = this.generateTokens(fullUser);

    return {
      user: this.sanitizeUser(fullUser),
      tokens,
    };
  }

  /**
   * Logs in a user using mobile number (Farmer/Buyer) or adminCode (Admin).
   */
  static async login({ identifier, password, role }) {
    if (!identifier || !password) {
      throw ApiError.badRequest('Identifier and password are required.');
    }

    const cleanIdentifier = identifier.trim();
    const normalizedRole = role ? role.toUpperCase() : null;

    let user;
    if (normalizedRole === 'ADMIN' || !/^\d{10}$/.test(cleanIdentifier)) {
      // Look up by adminCode or phone
      user = await prisma.user.findFirst({
        where: {
          OR: [{ adminCode: cleanIdentifier }, { phone: cleanIdentifier }],
        },
        include: { farmer: true, buyer: true },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { phone: cleanIdentifier },
        include: { farmer: true, buyer: true },
      });
    }

    if (!user) {
      throw ApiError.unauthorized('No account found with this mobile number. Please check the number or switch to Register.');
    }

    if (user.isActive === false) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    if (normalizedRole && user.role !== normalizedRole) {
      const roleDisplay = user.role.charAt(0) + user.role.slice(1).toLowerCase();
      throw ApiError.unauthorized(`This account is registered as a ${roleDisplay}. Please select the ${roleDisplay} tab to log in.`);
    }

    let isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // Support role-based demo passwords strictly for seeded accounts
    if (!isPasswordValid) {
      const p = (password || '').trim();
      const isSeededAccount = ['9876543210', '9876543211', '9123456780', '9123456781', 'ADMIN001'].includes(user.phone || user.adminCode);
      if (isSeededAccount) {
        if (
          (user.role === 'FARMER' && (p === 'farmer123' || p === 'password123')) ||
          (user.role === 'BUYER' && (p === 'buyer123' || p === 'password123')) ||
          (user.role === 'ADMIN' && (p === 'admin123' || p === 'password123'))
        ) {
          isPasswordValid = true;
        }
      }
    }

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid password. Please check and try again.');
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refreshes expired Access Token.
   */
  static async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required.');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { farmer: true, buyer: true },
      });

      if (!user || user.isActive === false) {
        throw ApiError.unauthorized('Invalid user session.');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }
  }

  /**
   * Updates preferred language for internationalization.
   */
  static async updateLanguage(userId, language) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language.toUpperCase() },
      select: { id: true, preferredLanguage: true },
    });
    return updated;
  }

  /**
   * Strips sensitive hashes from user output.
   */
  static sanitizeUser(user) {
    // eslint-disable-next-line no-unused-vars
    const { passwordHash, ...safeUser } = user;
    safeUser.name = safeUser.fullName || safeUser.name;
    return safeUser;
  }
}

module.exports = AuthService;

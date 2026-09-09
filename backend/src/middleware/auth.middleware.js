const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const ApiError = require('../utils/apiError');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Session has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        farmer: true,
        buyer: true,
      },
    });

    if (!user || user.isActive === false) {
      throw ApiError.unauthorized('User account does not exist or has been deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate };

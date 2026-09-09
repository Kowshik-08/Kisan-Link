const ApiError = require('../utils/apiError');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return next(
        ApiError.forbidden(
          `Role [${req.user.role}] is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}

module.exports = { authorizeRoles };

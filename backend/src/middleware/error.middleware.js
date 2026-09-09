const ApiError = require('../utils/apiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // 1. Prisma Unique Constraint Error (P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    error = ApiError.conflict(`A record with this ${target} already exists.`);
  }

  // 2. Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    error = ApiError.notFound('The requested record could not be found.');
  }

  // 3. Prisma Invalid Foreign Key (P2003)
  if (err.code === 'P2003') {
    error = ApiError.badRequest('Referenced record does not exist.');
  }

  // 4. Default / Generic fallback
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  };

  if (statusCode === 500) {
    console.error('💥 [Server Error]:', err);
  }

  return res.status(statusCode).json(response);
}

// 404 Route Not Found Handler
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };

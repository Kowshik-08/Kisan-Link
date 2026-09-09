const ApiError = require('../utils/apiError');

/**
 * Validates request object against validation rules.
 * @param {Object} schema { body?: function/object, query?: function/object, params?: function/object }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const err = schema.body(req.body);
      if (err) errors.push(...(Array.isArray(err) ? err : [err]));
    }

    if (schema.query) {
      const err = schema.query(req.query);
      if (err) errors.push(...(Array.isArray(err) ? err : [err]));
    }

    if (schema.params) {
      const err = schema.params(req.params);
      if (err) errors.push(...(Array.isArray(err) ? err : [err]));
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
}

module.exports = { validate };

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// Validation helpers
const registerValidation = {
  body: (body) => {
    const errors = [];
    if (!body.fullName && !body.name) errors.push('Full name is required.');
    if (!body.password || body.password.length < 6) errors.push('Password must be at least 6 characters.');
    if (body.role !== 'ADMIN' && (!body.phone || !/^\d{10}$/.test(body.phone))) {
      errors.push('A valid 10-digit mobile number is required.');
    }
    return errors;
  },
};

const loginValidation = {
  body: (body) => {
    const errors = [];
    if (!body.identifier && !body.phone && !body.adminId) errors.push('Mobile number or Admin ID is required.');
    if (!body.password) errors.push('Password is required.');
    return errors;
  },
};

router.post('/register', validate(registerValidation), AuthController.register);
router.post('/login', validate(loginValidation), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

router.get('/me', authenticate, AuthController.me);
router.patch('/language', authenticate, AuthController.updateLanguage);

module.exports = router;

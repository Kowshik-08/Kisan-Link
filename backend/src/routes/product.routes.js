const express = require('express');
const ProductController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Categories
router.get('/categories', ProductController.getAllCategories);
router.post('/categories', authenticate, authorizeRoles('ADMIN'), ProductController.createCategory);

// Products
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProduct);
router.post('/', authenticate, authorizeRoles('ADMIN'), ProductController.createProduct);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), ProductController.updateProduct);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), ProductController.deleteProduct);

module.exports = router;

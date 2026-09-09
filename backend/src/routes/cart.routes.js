const express = require('express');
const CartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.patch('/items/:itemId', CartController.updateItem);
router.delete('/items/:itemId', CartController.removeItem);
router.delete('/', CartController.clearCart);

module.exports = router;

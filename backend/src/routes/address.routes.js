const express = require('express');
const AddressController = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', AddressController.getUserAddresses);
router.post('/', AddressController.createAddress);
router.put('/:id', AddressController.updateAddress);
router.delete('/:id', AddressController.deleteAddress);

module.exports = router;

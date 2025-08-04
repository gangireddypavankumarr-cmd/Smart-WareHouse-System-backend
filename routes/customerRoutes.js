// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { getCustomers, addCustomer, removeCustomer } = require('../controllers/customerController');


// GET /api/customers
router.get('/', getCustomers);
// POST /api/customers
router.post('/', addCustomer);
// DELETE /api/customers/:id
router.delete('/:id', removeCustomer);

module.exports = router;

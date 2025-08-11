// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { getCustomers, addCustomer, removeCustomer, updateDaysAndBill } = require('../controllers/customerController');


// GET /api/customers
router.get('/', getCustomers);
// POST /api/customers
router.post('/', addCustomer);
// DELETE /api/customers/:id
router.delete('/:id', removeCustomer);
// PUT /api/customers/update-days-bill
router.put('/update-days-bill', updateDaysAndBill);

module.exports = router;

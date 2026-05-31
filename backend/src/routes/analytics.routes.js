'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/dashboard',         ctrl.getDashboard);
router.get('/sales',             ctrl.getSalesReport);
router.get('/top-products',      ctrl.getTopProducts);
router.get('/inventory-value',   ctrl.getInventoryValue);
router.get('/sales-by-category', ctrl.getSalesByCategory);

module.exports = router;
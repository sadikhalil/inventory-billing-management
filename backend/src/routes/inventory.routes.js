'use strict';
const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/movements',                  ctrl.getMovements);
router.get('/summary',                    ctrl.getInventorySummary);
router.get('/product/:productId/history', ctrl.getProductHistory);
router.post('/adjust', authorize('admin','manager'), [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('type').isIn(['purchase','sale','adjustment','return','transfer','damage','opening']),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  validate,
], ctrl.adjustStock);

module.exports = router;
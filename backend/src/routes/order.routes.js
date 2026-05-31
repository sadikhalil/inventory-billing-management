'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', ctrl.getOrders);
router.get('/:id', ctrl.getOrder);

router.post('/', [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.product').isMongoId().withMessage('Each item must have a valid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  validate,
], ctrl.createOrder);

router.patch('/:id/status', authorize('admin', 'manager'), [
  body('status').isIn(['pending','processing','shipped','delivered','cancelled','refunded']).withMessage('Invalid status'),
  validate,
], ctrl.updateOrderStatus);

router.patch('/:id/payment', authorize('admin', 'manager', 'cashier'), ctrl.updatePaymentStatus);
router.delete('/:id', authorize('admin', 'manager'), ctrl.cancelOrder);

module.exports = router;
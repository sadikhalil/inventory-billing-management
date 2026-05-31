'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/invoice.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', ctrl.getInvoices);
router.get('/overdue', ctrl.getOverdue);
router.get('/:id', ctrl.getInvoice);
router.get('/:id/pdf', ctrl.downloadPDF);

router.post('/', [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('items').isArray({ min: 1 }).withMessage('Invoice must have at least one item'),
  body('items.*.description').trim().notEmpty().withMessage('Each item must have a description'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Amount must be 0 or greater'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be 0 or greater'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be 0 or greater'),
  validate,
], ctrl.createInvoice);

router.put('/:id', authorize('admin', 'manager'), ctrl.updateInvoice);

router.patch('/:id/status', authorize('admin', 'manager'), [
  body('status').isIn(['draft','sent','paid','overdue','cancelled','void']).withMessage('Invalid status'),
  validate,
], ctrl.updateStatus);

router.post('/:id/payments', authorize('admin', 'manager', 'cashier'), [
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  validate,
], ctrl.recordPayment);

module.exports = router;
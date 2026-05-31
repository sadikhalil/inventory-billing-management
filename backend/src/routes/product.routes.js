'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(protect);

const productValidation = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name must be 2–200 characters'),
  body('sku').trim().matches(/^[A-Z0-9\-_]{2,30}$/i).withMessage('SKU must be 2–30 alphanumeric characters'),
  body('category').isIn(['Electronics','Office','Storage','Networking','Accessories','Furniture','Other']).withMessage('Invalid category'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be 0 or greater'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be 0 or greater'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or greater'),
  validate,
];

router.get('/', ctrl.getProducts);
router.get('/low-stock', ctrl.getLowStock);
router.get('/categories', ctrl.getCategories);
router.get('/barcode/:barcode', ctrl.getProductByBarcode);
router.get('/sku/:sku', ctrl.getProductBySku);
router.get('/:id', ctrl.getProduct);

router.post('/', authorize('admin', 'manager'), productValidation, ctrl.createProduct);
router.put('/:id', authorize('admin', 'manager'), productValidation, ctrl.updateProduct);
router.delete('/:id', authorize('admin', 'manager'), ctrl.deleteProduct);

module.exports = router;
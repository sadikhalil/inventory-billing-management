'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

// POST /api/v1/auth/register  — public signup (always creates viewer)
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], ctrl.register);

// POST /api/v1/auth/register-staff  — admin only, assigns correct role
router.post('/register-staff',
  protect,
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'manager', 'cashier', 'viewer']).withMessage('Invalid role'),
    validate,
  ],
  ctrl.registerStaff
);

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], ctrl.login);

// POST /api/v1/auth/refresh
router.post('/refresh', ctrl.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', protect, ctrl.logout);

// GET /api/v1/auth/me
router.get('/me', protect, ctrl.getMe);

// PUT /api/v1/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate,
], ctrl.changePassword);

module.exports = router;

'use strict';
const express = require('express');
const router  = express.Router();
const { User } = require('../models/User.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const AppError = require('../utils/AppError');

router.use(protect, authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, role, department, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { name, role, department, isActive },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    if (!user) return next(new AppError(`User not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return next(new AppError('Cannot deactivate your own account.', 400));
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
});

module.exports = router;
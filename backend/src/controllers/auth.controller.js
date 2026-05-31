'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User.model');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const signToken = (id, secret, expire) =>
  jwt.sign({ id }, secret, { expiresIn: expire });

const createTokens = (userId) => ({
  accessToken:  signToken(userId, process.env.JWT_SECRET,         process.env.JWT_EXPIRE         || '7d'),
  refreshToken: signToken(userId, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRE || '30d'),
});

const sendTokenResponse = (user, statusCode, res) => {
  const { accessToken, refreshToken } = createTokens(user._id);
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });
  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        department:  user.department,
        permissions: user.permissions,
      },
      accessToken,
      refreshToken,
    },
  });
};

// ── POST /api/v1/auth/register  (public — viewer only) ────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError(`Email already in use: ${email}`, 409));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'viewer',   // public signup always gets viewer
      department,
    });

    logger.info(`New user registered (viewer): ${email}`);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/register-staff  (admin only) ────────
exports.registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError(`Email already in use: ${email}`, 409));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,           // role comes from form — admin-only route so it's trusted
      department,
      createdBy: req.user._id,
    });

    logger.info(`Staff account created by ${req.user.email}: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: `${role} account created for ${name}`,
      data: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/login ───────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account deactivated. Contact an administrator.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`Login: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required.', 400));

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return next(new AppError('Invalid or expired refresh token.', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Refresh token mismatch. Please log in again.', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/logout ──────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/auth/me ───────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/auth/change-password ─────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

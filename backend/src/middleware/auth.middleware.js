'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User.model');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// ── Verify JWT ────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact an administrator.', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    next(new AppError('Authentication failed.', 500));
  }
};

// ── Role-Based Access Control ─────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        `Role '${req.user.role}' is not authorized to perform this action.`,
        403
      ));
    }
    next();
  };
};

// ── Permission-Based Access Control ──────────────────────
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!req.user.hasPermission(permission)) {
      return next(new AppError(
        `You do not have permission to perform this action. Required: '${permission}'`,
        403
      ));
    }
    next();
  };
};

// ── Optional Auth (for public routes that benefit from user context) ──
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
    next();
  } catch {
    next();
  }
};

module.exports = { protect, authorize, requirePermission, optionalAuth };
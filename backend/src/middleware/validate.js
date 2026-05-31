'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after express-validator chains.
 * Collects errors and throws a 422 if any found.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join('; ');
    return next(new AppError(`Validation failed — ${messages}`, 422));
  }
  next();
};

module.exports = validate;
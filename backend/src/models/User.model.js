'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  admin: ['*'],
  manager: [
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write',
    'invoices:read', 'invoices:write',
    'inventory:read', 'inventory:write',
    'analytics:read',
    'users:read',
  ],
  cashier: [
    'products:read',
    'orders:read', 'orders:write',
    'invoices:read', 'invoices:write',
    'inventory:read',
  ],
  viewer: [
    'products:read',
    'orders:read',
    'invoices:read',
    'inventory:read',
    'analytics:read',
  ],
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.VIEWER,
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department must not exceed 100 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes (email already indexed via unique:true on field definition)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual: permissions
userSchema.virtual('permissions').get(function () {
  return PERMISSIONS[this.role] || [];
});

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: check permission
userSchema.methods.hasPermission = function (permission) {
  const perms = PERMISSIONS[this.role] || [];
  return perms.includes('*') || perms.includes(permission);
};

// Remove password from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = { User, ROLES, PERMISSIONS };
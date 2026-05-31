'use strict';

const mongoose = require('mongoose');

const CATEGORIES = ['Electronics', 'Office', 'Storage', 'Networking', 'Accessories', 'Furniture', 'Other'];
const UNITS = ['piece', 'kg', 'litre', 'box', 'pack', 'metre', 'set'];

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [200, 'Name must not exceed 200 characters'],
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-_]{2,30}$/, 'SKU must be 2–30 alphanumeric characters'],
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Barcode must not exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description must not exceed 1000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(', ')}` },
  },
  unit: {
    type: String,
    enum: { values: UNITS, message: `Unit must be one of: ${UNITS.join(', ')}` },
    default: 'piece',
  },

  // Pricing
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative'],
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative'],
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
  },

  // Stock
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  reorderPoint: {
    type: Number,
    default: 10,
    min: [0, 'Reorder point cannot be negative'],
  },
  maxStock: {
    type: Number,
    min: [0, 'Max stock cannot be negative'],
  },

  // Meta
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, 'Supplier name must not exceed 200 characters'],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location must not exceed 100 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  images: [{
    type: String,
    maxlength: 500,
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes (sku and barcode already indexed via unique:true on field definitions)
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtuals
productSchema.virtual('profitMargin').get(function () {
  if (!this.costPrice || this.costPrice === 0) return 0;
  return (((this.sellingPrice - this.costPrice) / this.costPrice) * 100).toFixed(2);
});

productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.reorderPoint) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('stockValue').get(function () {
  return (this.stock * this.costPrice).toFixed(2);
});

// Validation: selling price should generally be >= cost price
productSchema.pre('save', function (next) {
  if (this.maxStock && this.stock > this.maxStock) {
    return next(new Error('Stock quantity cannot exceed maximum stock level'));
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = { Product, CATEGORIES, UNITS };
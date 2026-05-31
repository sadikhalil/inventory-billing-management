'use strict';

const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'online'];

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productSnapshot: {
    name: String,
    sku: String,
    barcode: String,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, { _id: true });

orderItemSchema.virtual('lineTotal').get(function () {
  const discounted = this.unitPrice * (1 - this.discount / 100);
  return discounted * this.quantity;
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    // auto-generated in pre-save
  },
  customer: {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    company: { type: String, trim: true },
  },
  items: {
    type: [orderItemSchema],
    validate: [(v) => v.length > 0, 'Order must have at least one item'],
  },
  status: {
    type: String,
    enum: { values: ORDER_STATUSES, message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` },
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: { values: PAYMENT_STATUSES, message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` },
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: { values: PAYMENT_METHODS, message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` },
  },

  // Financials (calculated on save)
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes must not exceed 1000 characters'],
  },
  shippingAddress: {
    type: String,
    trim: true,
  },

  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },

  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes (orderNumber already indexed via unique:true on field definition)
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual: balance due
orderSchema.virtual('balanceDue').get(function () {
  return Math.max(0, this.total - this.amountPaid);
});

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await this.constructor.countDocuments();
  this.orderNumber = `ORD-${String(count + 1001).padStart(6, '0')}`;
  next();
});

// Calculate totals before save
orderSchema.pre('save', function (next) {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  for (const item of this.items) {
    const lineGross = item.unitPrice * item.quantity;
    const lineDiscount = lineGross * (item.discount / 100);
    const lineNet = lineGross - lineDiscount;
    const lineTax = lineNet * (item.taxRate / 100);

    subtotal += lineGross;
    discountAmount += lineDiscount;
    taxAmount += lineTax;
  }

  this.subtotal = parseFloat(subtotal.toFixed(2));
  this.discountAmount = parseFloat(discountAmount.toFixed(2));
  this.taxAmount = parseFloat(taxAmount.toFixed(2));
  this.total = parseFloat((subtotal - discountAmount + taxAmount).toFixed(2));
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = { Order, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS };
'use strict';

const mongoose = require('mongoose');

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'];
const PAYMENT_TERMS = ['due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90'];

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    // auto-generated
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    company: { type: String, trim: true },
    taxId: { type: String, trim: true },
  },
  items: [{
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, required: true },
  }],

  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },

  currency: { type: String, default: 'USD', maxlength: 3 },
  status: {
    type: String,
    enum: INVOICE_STATUSES,
    default: 'draft',
  },
  paymentTerms: {
    type: String,
    enum: PAYMENT_TERMS,
    default: 'net_30',
  },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },

  notes: { type: String, trim: true, maxlength: 2000 },
  terms: { type: String, trim: true, maxlength: 2000 },

  pdfPath: { type: String },

  payments: [{
    amount: { type: Number, required: true },
    method: { type: String },
    reference: { type: String },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

// Indexes (invoiceNumber already indexed via unique:true on field definition)
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ 'customer.email': 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

invoiceSchema.virtual('balanceDue').get(function () {
  return Math.max(0, this.total - this.amountPaid);
});

invoiceSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'paid';
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await this.constructor.countDocuments();
  const year = new Date().getFullYear();
  this.invoiceNumber = `INV-${year}-${String(count + 1001).padStart(5, '0')}`;

  // Calculate due date from payment terms
  if (!this.dueDate) {
    const days = {
      due_on_receipt: 0, net_15: 15, net_30: 30, net_60: 60, net_90: 90,
    };
    const d = new Date(this.issueDate || Date.now());
    d.setDate(d.getDate() + (days[this.paymentTerms] || 30));
    this.dueDate = d;
  }
  next();
});

// Update amountPaid from payments array
invoiceSchema.pre('save', function (next) {
  if (this.payments && this.payments.length > 0) {
    this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
    if (this.amountPaid >= this.total) this.status = 'paid';
    else if (this.amountPaid > 0) this.status = 'sent';
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = { Invoice, INVOICE_STATUSES, PAYMENT_TERMS };
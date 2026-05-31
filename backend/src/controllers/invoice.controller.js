'use strict';

const path = require('path');
const fs = require('fs');
const { Invoice } = require('../models/Invoice.model');
const AppError = require('../utils/AppError');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// GET /api/v1/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(parseInt(limit))
        .populate('createdBy', 'name'),
      Invoice.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true, count: invoices.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page), data: invoices,
    });
  } catch (err) { next(err); }
};

// GET /api/v1/invoices/:id
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('order');
    if (!invoice) return next(new AppError(`Invoice not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// POST /api/v1/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// PUT /api/v1/invoices/:id
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(new AppError(`Invoice not found: ${req.params.id}`, 404));
    if (['paid', 'void'].includes(invoice.status)) {
      return next(new AppError(`Cannot edit a ${invoice.status} invoice.`, 400));
    }
    const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// POST /api/v1/invoices/:id/payments
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(new AppError(`Invoice not found: ${req.params.id}`, 404));
    if (invoice.status === 'paid') return next(new AppError('Invoice already fully paid.', 400));

    if (amount > invoice.balanceDue) {
      return next(new AppError(`Payment ($${amount}) exceeds balance due ($${invoice.balanceDue}).`, 400));
    }

    invoice.payments.push({ amount, method, reference, recordedBy: req.user._id });
    await invoice.save();
    res.status(200).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// GET /api/v1/invoices/:id/pdf
exports.downloadPDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('createdBy', 'name');
    if (!invoice) return next(new AppError(`Invoice not found: ${req.params.id}`, 404));

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// PATCH /api/v1/invoices/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status }, { new: true, runValidators: true }
    );
    if (!invoice) return next(new AppError(`Invoice not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// GET /api/v1/invoices/overdue
exports.getOverdue = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['paid', 'void', 'cancelled'] },
    }).sort('dueDate');
    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (err) { next(err); }
};
'use strict';

const { Order } = require('../models/Order.model');
const { Product } = require('../models/Product.model');
const { Invoice } = require('../models/Invoice.model');
const { InventoryMovement } = require('../models/InventoryMovement.model');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// GET /api/v1/orders
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status, paymentStatus, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(parseInt(limit))
        .populate('items.product', 'name sku barcode')
        .populate('createdBy', 'name'),
      Order.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true, count: orders.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page), data: orders,
    });
  } catch (err) { next(err); }
};

// GET /api/v1/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name sku barcode category sellingPrice')
      .populate('createdBy', 'name email')
      .populate('invoice');
    if (!order) return next(new AppError(`Order not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

// POST /api/v1/orders
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, customer, paymentMethod, notes, shippingAddress } = req.body;

    // Validate stock availability
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    const productMap = {};
    for (const p of products) productMap[p._id.toString()] = p;

    for (const item of items) {
      const product = productMap[item.product];
      if (!product) throw new AppError(`Product not found: ${item.product}`, 404);
      if (!product.isActive) throw new AppError(`Product '${product.name}' is inactive.`, 400);
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for '${product.name}'. Available: ${product.stock}`, 400);
      }

      // Set price from product if not provided
      if (!item.unitPrice) item.unitPrice = product.sellingPrice;
      if (!item.taxRate) item.taxRate = product.taxRate || 0;
      item.productSnapshot = { name: product.name, sku: product.sku, barcode: product.barcode };
    }

    // Create order
    const [order] = await Order.create([{
      items,
      customer,
      paymentMethod,
      notes,
      shippingAddress,
      createdBy: req.user._id,
      statusHistory: [{ status: 'pending', changedBy: req.user._id }],
    }], { session });

    // Deduct stock
    const movementDocs = [];
    for (const item of order.items) {
      const product = productMap[item.product.toString()];
      const stockBefore = product.stock;
      const stockAfter = stockBefore - item.quantity;

      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity }, updatedBy: req.user._id },
        { session }
      );

      movementDocs.push({
        product: item.product,
        type: 'sale',
        quantity: -item.quantity,
        stockBefore,
        stockAfter,
        unitCost: product.costPrice,
        reference: order.orderNumber,
        referenceDoc: order._id,
        referenceModel: 'Order',
        createdBy: req.user._id,
      });
    }
    await InventoryMovement.insertMany(movementDocs, { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// PATCH /api/v1/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError(`Order not found: ${req.params.id}`, 404));

    const allowed = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    if (!allowed[order.status]?.includes(status)) {
      return next(new AppError(`Cannot transition from '${order.status}' to '${status}'.`, 400));
    }

    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user._id, note });
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PATCH /api/v1/orders/:id/payment
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError(`Order not found: ${req.params.id}`, 404));

    if (amountPaid !== undefined) order.amountPaid = amountPaid;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    else {
      if (order.amountPaid >= order.total) order.paymentStatus = 'paid';
      else if (order.amountPaid > 0) order.paymentStatus = 'partial';
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

// DELETE /api/v1/orders/:id
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError(`Order not found: ${req.params.id}`, 404));
    if (['delivered', 'cancelled'].includes(order.status)) {
      return next(new AppError(`Cannot cancel a ${order.status} order.`, 400));
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: req.body.reason });
    await order.save();
    res.status(200).json({ success: true, message: 'Order cancelled.', data: order });
  } catch (err) { next(err); }
};
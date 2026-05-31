'use strict';

const { InventoryMovement } = require('../models/InventoryMovement.model');
const { Product } = require('../models/Product.model');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// GET /api/v1/inventory/movements
exports.getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, sort = '-createdAt', type, product } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (product) filter.product = product;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter).sort(sort).skip(skip).limit(parseInt(limit))
        .populate('product', 'name sku barcode')
        .populate('createdBy', 'name'),
      InventoryMovement.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true, count: movements.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page), data: movements,
    });
  } catch (err) { next(err); }
};

// POST /api/v1/inventory/adjust
exports.adjustStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, type, quantity, note, unitCost } = req.body;

    const product = await Product.findById(productId).session(session);
    if (!product) throw new AppError(`Product not found: ${productId}`, 404);

    const absQty = Math.abs(quantity);
    const direction = ['purchase', 'return', 'opening'].includes(type) ? 1 : -1;
    const newStock = product.stock + direction * absQty;

    if (newStock < 0) {
      throw new AppError(`Insufficient stock. Current: ${product.stock}, Requested: ${absQty}`, 400);
    }

    const movement = await InventoryMovement.create([{
      product: productId,
      type,
      quantity: direction * absQty,
      stockBefore: product.stock,
      stockAfter: newStock,
      unitCost: unitCost || product.costPrice,
      note,
      createdBy: req.user._id,
    }], { session });

    product.stock = newStock;
    product.updatedBy = req.user._id;
    await product.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: { movement: movement[0], product: { id: product._id, name: product.name, newStock } },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// GET /api/v1/inventory/summary
exports.getInventorySummary = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });
    const summary = {
      total: products.length,
      inStock: products.filter((p) => p.stockStatus === 'in_stock').length,
      lowStock: products.filter((p) => p.stockStatus === 'low_stock').length,
      outOfStock: products.filter((p) => p.stockStatus === 'out_of_stock').length,
      totalUnits: products.reduce((s, p) => s + p.stock, 0),
      totalValue: products.reduce((s, p) => s + p.stock * p.costPrice, 0).toFixed(2),
    };
    const lowStockItems = products
      .filter((p) => p.stockStatus !== 'in_stock')
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);
    res.status(200).json({ success: true, data: { summary, lowStockItems } });
  } catch (err) { next(err); }
};

// GET /api/v1/inventory/product/:productId/history
exports.getProductHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const movements = await InventoryMovement.find({ product: productId })
      .sort('-createdAt').limit(100).populate('createdBy', 'name');
    res.status(200).json({ success: true, count: movements.length, data: movements });
  } catch (err) { next(err); }
};
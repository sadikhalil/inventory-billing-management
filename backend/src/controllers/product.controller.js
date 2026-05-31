'use strict';

const { Product } = require('../models/Product.model');
const { InventoryMovement } = require('../models/InventoryMovement.model');
const AppError = require('../utils/AppError');

// GET /api/v1/products
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, sort = '-createdAt',
      category, isActive, search, stockStatus,
      minPrice, maxPrice,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = parseFloat(maxPrice);
    }

    // Stock status filter (post-query virtual)
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      Product.countDocuments(filter),
    ]);

    // Filter by stock status if requested
    let filtered = products;
    if (stockStatus) {
      filtered = products.filter((p) => p.stockStatus === stockStatus);
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: filtered,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');
    if (!product) return next(new AppError(`Product not found: ${req.params.id}`, 404));
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/barcode/:barcode
exports.getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    if (!product) return next(new AppError(`No product found with barcode: ${req.params.barcode}`, 404));
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/sku/:sku
exports.getProductBySku = async (req, res, next) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() });
    if (!product) return next(new AppError(`No product found with SKU: ${req.params.sku}`, 404));
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });

    // Record opening stock movement
    if (product.stock > 0) {
      await InventoryMovement.create({
        product: product._id,
        type: 'opening',
        quantity: product.stock,
        stockBefore: 0,
        stockAfter: product.stock,
        unitCost: product.costPrice,
        reference: 'OPENING',
        note: 'Initial stock on product creation',
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const { stock, ...updateData } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError(`Product not found: ${req.params.id}`, 404));

    // Stock changes must go through inventory movement endpoint
    if (stock !== undefined && stock !== product.stock) {
      return next(new AppError('Use the inventory adjustment endpoint to change stock levels.', 400));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError(`Product not found: ${req.params.id}`, 404));

    // Soft delete
    await Product.findByIdAndUpdate(req.params.id, {
      isActive: false,
      updatedBy: req.user._id,
    });

    res.status(200).json({ success: true, message: 'Product deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter((p) => p.stockStatus !== 'in_stock');
    res.status(200).json({ success: true, count: lowStock.length, data: lowStock });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/categories
exports.getCategories = async (req, res, next) => {
  try {
    const { CATEGORIES } = require('../models/Product.model');
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, data: stats, available: CATEGORIES });
  } catch (err) {
    next(err);
  }
};
'use strict';

const { Order } = require('../models/Order.model');
const { Product } = require('../models/Product.model');
const { Invoice } = require('../models/Invoice.model');
const { InventoryMovement } = require('../models/InventoryMovement.model');

// GET /api/v1/analytics/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue, lastMonthRevenue,
      totalOrders, lastMonthOrders,
      totalProducts, lowStockProducts,
      pendingInvoices,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }).then((ps) => ps.filter((p) => p.stockStatus !== 'in_stock').length),
      Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] } }),
    ]);

    const rev = totalRevenue[0]?.total || 0;
    const lastRev = lastMonthRevenue[0]?.total || 0;
    const revGrowth = lastRev > 0 ? (((rev - lastRev) / lastRev) * 100).toFixed(1) : null;
    const orderGrowth = lastMonthOrders > 0
      ? (((totalOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1) : null;

    res.status(200).json({
      success: true,
      data: {
        revenue: { current: rev, previous: lastRev, growth: revGrowth },
        orders: { current: totalOrders, previous: lastMonthOrders, growth: orderGrowth },
        products: { total: totalProducts, lowStock: lowStockProducts },
        invoices: { pending: pendingInvoices },
      },
    });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/sales?period=6months
exports.getSalesReport = async (req, res, next) => {
  try {
    const { period = '6months', groupBy = 'month' } = req.query;
    const since = getPeriodDate(period);

    const pipeline = [
      { $match: { status: { $nin: ['cancelled', 'refunded'] }, createdAt: { $gte: since } } },
      {
        $group: {
          _id: groupBy === 'day'
            ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }
            : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ];

    const data = await Order.aggregate(pipeline);

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/top-products?limit=10
exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, period = '30days' } = req.query;
    const since = getPeriodDate(period);

    const data = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products', localField: '_id', foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: '$product.name', sku: '$product.sku',
          category: '$product.category', totalQuantity: 1,
          totalRevenue: 1, orderCount: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/inventory-value
exports.getInventoryValue = async (req, res, next) => {
  try {
    const data = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalCostValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } },
          totalUnits: { $sum: '$stock' },
          productCount: { $sum: 1 },
        },
      },
      { $sort: { totalCostValue: -1 } },
    ]);

    const totals = data.reduce((acc, d) => ({
      totalCostValue: acc.totalCostValue + d.totalCostValue,
      totalSellingValue: acc.totalSellingValue + d.totalSellingValue,
      totalUnits: acc.totalUnits + d.totalUnits,
      productCount: acc.productCount + d.productCount,
    }), { totalCostValue: 0, totalSellingValue: 0, totalUnits: 0, productCount: 0 });

    res.status(200).json({ success: true, data, totals });
  } catch (err) { next(err); }
};

// GET /api/v1/analytics/sales-by-category
exports.getSalesByCategory = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    const since = getPeriodDate(period);

    const data = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products', localField: 'items.product',
          foreignField: '_id', as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// Helper
function getPeriodDate(period) {
  const d = new Date();
  const map = {
    '7days': 7, '30days': 30, '3months': 90,
    '6months': 180, '1year': 365,
  };
  d.setDate(d.getDate() - (map[period] || 30));
  return d;
}

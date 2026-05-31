'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/User.model');
const { Product } = require('../models/Product.model');
const { Order } = require('../models/Order.model');
const { Invoice } = require('../models/Invoice.model');
const { InventoryMovement } = require('../models/InventoryMovement.model');

const seed = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_inventory';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Drop entire database — removes all stale indexes
    await mongoose.connection.dropDatabase();
    console.log('🗑  Database dropped — clean slate\n');

    // ── USERS ─────────────────────────────────────────────
    const users = await User.create([
      { name: 'Admin User',    email: 'admin@invotrack.com',   password: 'Admin@1234',   role: 'admin',   department: 'Management', isActive: true },
      { name: 'Sarah Manager', email: 'manager@invotrack.com', password: 'Manager@1234', role: 'manager', department: 'Inventory',  isActive: true },
      { name: 'John Cashier',  email: 'cashier@invotrack.com', password: 'Cashier@1234', role: 'cashier', department: 'Billing',    isActive: true },
      { name: 'Viewer User',   email: 'viewer@invotrack.com',  password: 'Viewer@1234',  role: 'viewer',  department: 'Sales',      isActive: true },
    ]);

    const adminId   = users[0]._id;
    const managerId = users[1]._id;
    const cashierId = users[2]._id;

    console.log(`👤 Created ${users.length} users`);
    console.log('   Admin    →  admin@invotrack.com    /  Admin@1234');
    console.log('   Manager  →  manager@invotrack.com  /  Manager@1234');
    console.log('   Cashier  →  cashier@invotrack.com  /  Cashier@1234');
    console.log('   Viewer   →  viewer@invotrack.com   /  Viewer@1234\n');

    // ── PRODUCTS ──────────────────────────────────────────
    const products = await Product.create([
      { name: 'Wireless Keyboard Pro',  sku: 'WK-001', barcode: '4011000001', category: 'Electronics', unit: 'piece', costPrice: 25.00, sellingPrice: 49.99, taxRate: 10, stock: 82, reorderPoint: 20, supplier: 'TechSupply Inc', location: 'Shelf A1', createdBy: adminId },
      { name: 'USB-C Hub 7-Port',       sku: 'UC-007', barcode: '4011000002', category: 'Electronics', unit: 'piece', costPrice: 18.00, sellingPrice: 34.99, taxRate: 10, stock: 6,  reorderPoint: 15, supplier: 'ConnectPro',    location: 'Shelf A2', createdBy: adminId },
      { name: 'Ergonomic Monitor Stand',sku: 'MS-001', barcode: '4011000003', category: 'Office',      unit: 'piece', costPrice: 15.00, sellingPrice: 29.99, taxRate: 0,  stock: 45, reorderPoint: 10, supplier: 'OfficePlus',    location: 'Shelf B1', createdBy: adminId },
      { name: 'SSD 1TB NVMe',          sku: 'SS-1TB', barcode: '4011000004', category: 'Storage',     unit: 'piece', costPrice: 55.00, sellingPrice: 89.99, taxRate: 10, stock: 3,  reorderPoint: 8,  supplier: 'StoragePro',    location: 'Shelf C1', createdBy: adminId },
      { name: 'Ethernet Switch 8-Port', sku: 'ES-008', barcode: '4011000005', category: 'Networking',  unit: 'piece', costPrice: 25.00, sellingPrice: 44.99, taxRate: 10, stock: 28, reorderPoint: 5,  supplier: 'NetGear',       location: 'Shelf D1', createdBy: adminId },
      { name: 'Webcam HD 1080p',        sku: 'WC-HD1', barcode: '4011000006', category: 'Electronics', unit: 'piece', costPrice: 30.00, sellingPrice: 59.99, taxRate: 10, stock: 4,  reorderPoint: 10, supplier: 'VisionTech',    location: 'Shelf A3', createdBy: adminId },
      { name: 'Desk Organizer Pro',     sku: 'DO-001', barcode: '4011000007', category: 'Office',      unit: 'piece', costPrice: 8.00,  sellingPrice: 19.99, taxRate: 0,  stock: 60, reorderPoint: 15, supplier: 'OfficePlus',    location: 'Shelf B2', createdBy: adminId },
      { name: 'NVMe PCIe Adapter',      sku: 'NV-001', barcode: '4011000008', category: 'Storage',     unit: 'piece', costPrice: 7.00,  sellingPrice: 14.99, taxRate: 10, stock: 35, reorderPoint: 10, supplier: 'StoragePro',    location: 'Shelf C2', createdBy: adminId },
      { name: 'Wireless Mouse Slim',    sku: 'WM-002', barcode: '4011000009', category: 'Electronics', unit: 'piece', costPrice: 12.00, sellingPrice: 24.99, taxRate: 10, stock: 55, reorderPoint: 20, supplier: 'TechSupply Inc', location: 'Shelf A4', createdBy: adminId },
      { name: 'HDMI Cable 2m',          sku: 'HC-2M',  barcode: '4011000010', category: 'Accessories', unit: 'piece', costPrice: 3.00,  sellingPrice: 9.99,  taxRate: 0,  stock: 0,  reorderPoint: 25, supplier: 'CableCo',       location: 'Shelf E1', createdBy: adminId },
    ]);
    console.log(`📦 Created ${products.length} products\n`);

    // ── OPENING STOCK MOVEMENTS ───────────────────────────
    await InventoryMovement.insertMany(
      products.filter(p => p.stock > 0).map(p => ({
        product: p._id,
        type: 'opening',
        quantity: p.stock,
        stockBefore: 0,
        stockAfter: p.stock,
        unitCost: p.costPrice,
        reference: 'OPENING',
        note: 'Initial stock',
        createdBy: adminId,
      }))
    );
    console.log('📊 Opening stock movements recorded\n');

    // ── ORDERS ────────────────────────────────────────────
    const order1 = new Order({
      customer: { name: 'Acme Corp Ltd', email: 'billing@acme.com', company: 'Acme Corp' },
      items: [
        { product: products[0]._id, quantity: 2, unitPrice: 49.99, taxRate: 10, discount: 0, productSnapshot: { name: products[0].name, sku: products[0].sku } },
        { product: products[2]._id, quantity: 1, unitPrice: 29.99, taxRate: 0,  discount: 0, productSnapshot: { name: products[2].name, sku: products[2].sku } },
      ],
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'bank_transfer',
      createdBy: cashierId,
    });
    await order1.save();
    order1.amountPaid = order1.total;
    await order1.save();

    const order2 = new Order({
      customer: { name: 'TechStart Inc', email: 'orders@techstart.io' },
      items: [
        { product: products[3]._id, quantity: 2, unitPrice: 89.99, taxRate: 10, discount: 0, productSnapshot: { name: products[3].name, sku: products[3].sku } },
        { product: products[4]._id, quantity: 1, unitPrice: 44.99, taxRate: 10, discount: 0, productSnapshot: { name: products[4].name, sku: products[4].sku } },
      ],
      status: 'processing',
      paymentStatus: 'unpaid',
      createdBy: managerId,
    });
    await order2.save();

    console.log('🛒 Created 2 orders\n');

    // ── INVOICES ──────────────────────────────────────────
    const inv1 = new Invoice({
      order: order1._id,
      customer: { name: 'Acme Corp Ltd', email: 'billing@acme.com', company: 'Acme Corp' },
      items: [
        { description: 'Wireless Keyboard Pro x2', quantity: 2, unitPrice: 49.99, discount: 0, taxRate: 10, amount: 99.98 },
        { description: 'Ergonomic Monitor Stand x1', quantity: 1, unitPrice: 29.99, discount: 0, taxRate: 0, amount: 29.99 },
      ],
      subtotal: 129.97,
      discountAmount: 0,
      taxAmount: 10.00,
      total: 139.97,
      amountPaid: 139.97,
      status: 'paid',
      paymentTerms: 'net_30',
      payments: [{ amount: 139.97, method: 'bank_transfer', reference: 'TXN-001', recordedBy: adminId }],
      createdBy: cashierId,
    });
    await inv1.save();

    const inv2 = new Invoice({
      order: order2._id,
      customer: { name: 'TechStart Inc', email: 'orders@techstart.io' },
      items: [
        { description: 'SSD 1TB NVMe x2',          quantity: 2, unitPrice: 89.99, discount: 0, taxRate: 10, amount: 179.98 },
        { description: 'Ethernet Switch 8-Port x1', quantity: 1, unitPrice: 44.99, discount: 0, taxRate: 10, amount: 44.99  },
      ],
      subtotal: 224.97,
      discountAmount: 0,
      taxAmount: 22.50,
      total: 247.47,
      amountPaid: 0,
      status: 'sent',
      paymentTerms: 'net_15',
      createdBy: managerId,
    });
    await inv2.save();

    console.log('🧾 Created 2 invoices\n');

    // ── DONE ──────────────────────────────────────────────
    console.log('═'.repeat(52));
    console.log('  ✅  DATABASE SEEDED SUCCESSFULLY');
    console.log('═'.repeat(52));
    console.log('  Users     : ' + users.length);
    console.log('  Products  : ' + products.length);
    console.log('  Orders    : 2');
    console.log('  Invoices  : 2');
    console.log('═'.repeat(52));
    console.log('  Admin    →  admin@invotrack.com    /  Admin@1234');
    console.log('  Manager  →  manager@invotrack.com  /  Manager@1234');
    console.log('  Cashier  →  cashier@invotrack.com  /  Cashier@1234');
    console.log('  Viewer   →  viewer@invotrack.com   /  Viewer@1234');
    console.log('═'.repeat(52));

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
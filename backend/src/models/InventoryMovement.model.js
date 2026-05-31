'use strict';

const mongoose = require('mongoose');

const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage', 'opening'];

const inventoryMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: { values: MOVEMENT_TYPES, message: `Type must be one of: ${MOVEMENT_TYPES.join(', ')}` },
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
  },
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  unitCost: { type: Number, min: 0 },

  reference: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  referenceDoc: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Invoice', null],
  },

  note: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1 });
inventoryMovementSchema.index({ createdAt: -1 });

const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
module.exports = { InventoryMovement, MOVEMENT_TYPES };
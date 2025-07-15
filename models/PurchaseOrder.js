const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  photo: {
    type: String,
    default: '',
  },
}, { _id: true });

const purchaseOrderPaymentSchema = new mongoose.Schema({
  paymentType: {
    type: String,
    required: true,
    enum: ['advance', 'down_payment', 'full_payment'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'wire', 'ach', 'check', 'cash'],
  },
  reference: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  description: {
    type: String,
    default: '',
  },
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  supplierName: {
    type: String,
    required: true,
  },
  items: [purchaseOrderItemSchema],
  paymentTerms: {
    type: String,
    required: true,
    default: 'Net 30',
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  payments: [purchaseOrderPaymentSchema],
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sent', 'confirmed', 'received'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  versionKey: false,
});

// Update the updatedAt field before saving
purchaseOrderSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Calculate remaining amount before saving
purchaseOrderSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: true,
    trim: true,
  },
    Balance:{
    type:Number,
    default:0
  },
  PurchaseBalance:{
    type:Number,
    default:0
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
    purchaseOrders: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' }
  ]
}, {
  versionKey: false,
});

// Update the updatedAt field before saving
supplierSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
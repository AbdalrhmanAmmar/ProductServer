const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  workflowType: {
    type: String,
    required: true,
    enum: ['fast-track', 'standard'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  expectedDelivery: {
    type: Date,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  requirements: {
    type: String,
    required: true,
  },
  specialInstructions: {
    type: String,
    default: '',
  },
  // Archive functionality
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: {
    type: Date,
    default: null,
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Workflow progress tracking
  hasPurchaseOrders: {
    type: Boolean,
    default: false,
  },
  hasInvoices: {
    type: Boolean,
    default: false,
  },
  hasShipping: {
    type: Boolean,
    default: false,
  },
  hasQuotations: {
    type: Boolean,
    default: false,
  },
  orderItem:{
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

}, {
  versionKey: false,
});

// Update the updatedAt field before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // البحث عن آخر طلب للحصول على أعلى قيمة orderItem
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderItem': -1 } });
    if (lastOrder && lastOrder.orderItem) {
      this.orderItem = lastOrder.orderItem + 1;
    } else {
      this.orderItem = 1; 
    }
  }
  
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
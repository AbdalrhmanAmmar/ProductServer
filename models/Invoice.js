const mongoose = require('mongoose');

// تعريف Schema للبنود داخل الفاتورة
const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },

  // تفاصيل العميل
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false // لو عندك جدول عملاء
  },
  clientName: {
    type: String,
    required: true
  },

  // تواريخ
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },

  // شروط الدفع
  paymentTerms: {
    type: String,
    required: true,
    default: 'Net 30'
  },

  // البنود داخل الفاتورة
  items: {
    type: [invoiceItemSchema],
    default: []
  },

  // ملخص مالي
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0
  },
  commissionFee: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // حالة الفاتورة
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false });

invoiceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;

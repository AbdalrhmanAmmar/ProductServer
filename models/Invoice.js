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

  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentTerms: {
    type: String,
    required: true,
    default: 'Net 30'
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    default: 5 // قيمة افتراضية
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
  TotalInvoice: { // إضافة تتبع المدفوعات
    type: Number,
    default: 0,
    min: 0
  },
  InvoiceItem:{
    type:Number,
    default:0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'cancelled'],
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

invoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    // البحث عن آخر فاتورة للحصول على أعلى قيمة InvoiceItem
    const lastInvoice = await this.constructor.findOne({}, {}, { sort: { 'InvoiceItem': -1 } });
    this.InvoiceItem = lastInvoice ? lastInvoice.InvoiceItem + 1 : 1;
  }
  
  this.updatedAt = Date.now();
  next();
});


const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;

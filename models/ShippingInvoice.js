const mongoose = require('mongoose');

const ShippingItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  photo: { type: String },
  weight: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
});

const ShippingInvoiceSchema = new mongoose.Schema({
    orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  InvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  shippingCompanyName: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  expectedDelivery: { type: Date, required: true },
  freightCharges: { type: Number, default: 0 },
  insurance: { type: Number, default: 0 },
  handlingFees: { type: Number, default: 0 },
  totalShippingCost: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingItem:{
    type:Number,
    default:0
  },
  items: [ShippingItemSchema]
}, { timestamps: true });

ShippingInvoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // البحث عن آخر مستند شحن للحصول على أعلى قيمة shippingItem
      const lastShipping = await this.constructor.findOne({})
        .sort({ shippingItem: -1 })
        .select('shippingItem')
        .lean();

      this.shippingItem = lastShipping ? lastShipping.shippingItem + 1 : 1;
    } catch (err) {
      console.error('Error auto-incrementing shippingItem:', err);
      this.shippingItem = 1; // القيمة الافتراضية في حالة حدوث خطأ
    }
  }
  next();
});

const ShippingInvoice = mongoose.model('ShippingInvoice', ShippingInvoiceSchema);

module.exports = ShippingInvoice;
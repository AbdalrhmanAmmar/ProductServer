const mongoose = require('mongoose');

const ShippingItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  photo: { type: String },
  weight: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
});

const ShippingInvoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
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
  items: [ShippingItemSchema]
}, { timestamps: true });

const shipping = mongoose.model('ShippingInvoice', ShippingInvoiceSchema);

module.exports = shipping;

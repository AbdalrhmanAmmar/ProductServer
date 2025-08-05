const mongoose = require('mongoose');
const ShippingInvoice = require('../models/ShippingInvoice');

class ShippingService {
  static async validateShippingData(data) {
    const requiredFields = [
      'InvoiceId',
      'shippingCompanyName',
      'trackingNumber',
      'expectedDelivery',
      'totalShippingCost',
      'items'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('At least one item is required');
    }

    const invalidItems = data.items.filter(item => 
      !item.description || 
      !item.quantity || 
      item.quantity < 1
    );
    
    if (invalidItems.length > 0) {
      throw new Error('Each item must have description and quantity (minimum 1)');
    }

    if (isNaN(new Date(data.expectedDelivery).getTime())) {
      throw new Error('Invalid expected delivery date');
    }

    const numericFields = {
      freightCharges: data.freightCharges || 0,
      insurance: data.insurance || 0,
      handlingFees: data.handlingFees || 0,
      totalShippingCost: data.totalShippingCost
    };
    
    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(value) || value < 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  }

static async createShippingInvoice(data) {
  try {
    // التحقق من وجود orderId
    if (!data.orderId) {
      throw new Error('Order ID is required');
    }

    await this.validateShippingData(data);

    const shippingInvoice = new ShippingInvoice({
      orderId: data.orderId,
      InvoiceId: data.InvoiceId,
      shippingCompanyName: data.shippingCompanyName,
      trackingNumber: data.trackingNumber,
      expectedDelivery: new Date(data.expectedDelivery),
      freightCharges: data.freightCharges || 0,
      insurance: data.insurance || 0,
      handlingFees: data.handlingFees || 0,
      totalShippingCost: data.totalShippingCost,
      status: data.status || 'pending',
      items: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        photo: item.photo || '',
        weight: item.weight || 0,
        volume: item.volume || 0,
        purchaseOrderId: item.purchaseOrderId // إضافة إذا كنت تريد ربط الأصناف بأوامر الشراء
      }))
    });

    const savedInvoice = await shippingInvoice.save();
    
    // تحديث حالة الفاتورة
    await mongoose.model('Invoice').findByIdAndUpdate(
      data.InvoiceId,
      { $set: { shippingStatus: 'processing' } },
      { new: true }
    );

    // تحديث حالة الطلب إذا لزم الأمر
    await mongoose.model('Order').findByIdAndUpdate(
      data.orderId,
      { $set: { hasShipping: true } },
      { new: true }
    );

    return savedInvoice;
  } catch (error) {
    console.error('Error creating shipping invoice:', error);
    throw error;
  }
}
  static async updateShippingInvoice(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid shipping invoice ID');
      }

      const invoice = await ShippingInvoice.findById(id);
      if (!invoice) {
        throw new Error('Shipping invoice not found');
      }

      const updatableFields = [
        'shippingCompanyName',
        'trackingNumber',
        'expectedDelivery',
        'freightCharges',
        'insurance',
        'handlingFees',
        'totalShippingCost',
        'status',
        'items'
      ];

      updatableFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'expectedDelivery') {
            invoice[field] = new Date(updateData[field]);
          } else {
            invoice[field] = updateData[field];
          }
        }
      });

      const updatedInvoice = await invoice.save();
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating shipping invoice:', error);
      throw error;
    }
  }

  static async getShippingInvoicesByOrderId(orderId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid order ID');
      }

      const invoices = await ShippingInvoice.find({ orderId });
      return invoices;
    } catch (error) {
      console.error('Error fetching shipping invoices:', error);
      throw error;
    }
  }
}

module.exports = ShippingService;
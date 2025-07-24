const ShippingInvoice = require('../models/ShippingInvoice');
class ShippingService {
  static async createShippingInvoice(data) {
    try {
      console.log('Creating shipping invoice:', JSON.stringify(data, null, 2));

      const shippingInvoice = new ShippingInvoice({
        ...data,
        expectedDelivery: new Date(data.expectedDelivery),
      });

      const saved = await shippingInvoice.save();
      console.log('Shipping invoice created successfully:', saved._id);
      return saved;
    } catch (error) {
      console.error('Error creating shipping invoice:', error);
      throw error;
    }
  }

  static async updateShippingInvoice(id, updateData) {
    try {
      console.log('Updating shipping invoice ID:', id);
      const invoice = await ShippingInvoice.findById(id);
      if (!invoice) throw new Error('Shipping invoice not found');

      // Update fields
      if (updateData.shippingCompanyName) invoice.shippingCompanyName = updateData.shippingCompanyName;
      if (updateData.trackingNumber) invoice.trackingNumber = updateData.trackingNumber;
      if (updateData.expectedDelivery) invoice.expectedDelivery = new Date(updateData.expectedDelivery);
      if (updateData.freightCharges !== undefined) invoice.freightCharges = updateData.freightCharges;
      if (updateData.insurance !== undefined) invoice.insurance = updateData.insurance;
      if (updateData.handlingFees !== undefined) invoice.handlingFees = updateData.handlingFees;
      if (updateData.totalShippingCost !== undefined) invoice.totalShippingCost = updateData.totalShippingCost;
      if (updateData.status) invoice.status = updateData.status;
      if (updateData.items) invoice.items = updateData.items;

      const updated = await invoice.save();
      console.log('Shipping invoice updated successfully:', updated._id);
      return updated;
    } catch (error) {
      console.error('Error updating shipping invoice:', error);
      throw error;
    }
  }
}

module.exports = ShippingService;

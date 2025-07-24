const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

class InvoiceService {
  static async createInvoice(invoiceData) {
    try {
      console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2));

      const { purchaseId, dueDate, paymentTerms } = invoiceData;

      // Validate purchase order exists
      const purchaseOrder = await PurchaseOrder.findById(purchaseId);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Create invoice
      const invoice = new Invoice({
        purchaseId,
        dueDate: new Date(dueDate),
        paymentTerms,
        status: 'unpaid',
      });

      const savedInvoice = await invoice.save();

      console.log('Invoice created successfully:', savedInvoice._id);
      return savedInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }
  static async updateInvoice(invoiceId, updateData) {
  try {
    console.log('Updating invoice with ID:', invoiceId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Only update allowed fields
    if (updateData.dueDate) invoice.dueDate = new Date(updateData.dueDate);
    if (updateData.paymentTerms) invoice.paymentTerms = updateData.paymentTerms;
    if (updateData.status) invoice.status = updateData.status;

    const updatedInvoice = await invoice.save();

    console.log('Invoice updated successfully:', updatedInvoice._id);
    return updatedInvoice;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

}

module.exports = InvoiceService;

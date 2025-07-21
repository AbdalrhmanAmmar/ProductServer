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
}

module.exports = InvoiceService;

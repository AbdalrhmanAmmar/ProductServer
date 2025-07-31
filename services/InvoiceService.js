const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

class InvoiceService {
static async createInvoice(invoiceData) {
  try {
    const {
      purchaseId,
      dueDate,
      paymentTerms,
      items = [],
      commissionRate
    } = invoiceData;

    // Basic validation
    if (!items || items.length === 0) {
      throw new Error('At least one invoice item is required');
    }

    // Verify purchase order exists (but don't need its orderId)
    const purchaseOrderExists = await PurchaseOrder.exists({ _id: purchaseId });
    if (!purchaseOrderExists) {
      throw new Error('Purchase order not found');
    }

    // Calculate invoice amounts
    const calculatedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const actualCommissionRate = commissionRate || 5;
    const commissionFee = subtotal * (actualCommissionRate / 100);
    const total = subtotal + commissionFee;

    // Create invoice
    const invoice = new Invoice({
      purchaseId,
      dueDate: new Date(dueDate),
      paymentTerms: paymentTerms || 'Net 30',
      items: calculatedItems,
      subtotal,
      commissionRate: actualCommissionRate,
      commissionFee,
      total,
      status: 'draft',
    });

    const savedInvoice = await invoice.save();

    return {
      success: true,
      message: 'Invoice created successfully',
      data: savedInvoice
    };

  } catch (error) {
    console.error('Invoice creation error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to create invoice',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
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

static async getInvoicesByPurchaseId(purchaseId) {
  try {
    const invoices = await Invoice.find({ purchaseId })

      .exec();

    return {
      success: true,
      data: invoices
    };
  } catch (error) {
    console.error('Error fetching invoices by purchase ID:', error);
    return {
      success: false,
      message: 'Failed to fetch invoices by purchase ID',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}




}



module.exports = InvoiceService;

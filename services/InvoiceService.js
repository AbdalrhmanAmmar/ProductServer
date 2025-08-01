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
    // 1. التحقق من وجود الفاتورة
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // 2. تحديث العناصر إذا وجدت
    if (updateData.items) {
      invoice.items = updateData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice // احتساب الـ total تلقائياً
      }));

      // 3. إعادة حساب المجاميع
      invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      invoice.commissionFee = invoice.subtotal * (invoice.commissionRate / 100);
      invoice.total = invoice.subtotal + invoice.commissionFee;
    }

    // 4. تحديث الحقول الأخرى
    const updatableFields = ['dueDate', 'paymentTerms', 'status', 'commissionRate'];
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        invoice[field] = field === 'dueDate' ? new Date(updateData[field]) : updateData[field];
      }
    });

    // 5. حفظ التغييرات
    const updatedInvoice = await invoice.save();

    return {
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    };

  } catch (error) {
    console.error('Update error:', error);
    return { success: false, message: error.message };
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

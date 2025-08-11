const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const Client = require('../models/Client');
const mongoose = require("mongoose");

class InvoiceService {
static async createInvoice(invoiceData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      purchaseId,
      dueDate,
      paymentTerms,
      items = [],
      commissionRate
    } = invoiceData;

    // التحقق من وجود عناصر الفاتورة
    if (!items.length) {
      throw new Error('يجب وجود عنصر واحد على الأقل في الفاتورة');
    }

    // جلب طلب الشراء فقط بدون أي عمليات populate أو references أخرى
    const purchaseOrder = await PurchaseOrder.findById(purchaseId).session(session);
    if (!purchaseOrder) {
      throw new Error('طلب الشراء غير موجود');
    }

    // حساب مبالغ الفاتورة
    const calculatedItems = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const rate = commissionRate ?? 5;
    const commissionFee = subtotal * (rate / 100);
    const total = subtotal + commissionFee;

    // إنشاء الفاتورة
    const invoice = new Invoice({
      purchaseId,
      invoiceDate: new Date(),
      dueDate: new Date(dueDate),
      paymentTerms: paymentTerms || 'Net 30',
      items: calculatedItems,
      subtotal,
      commissionRate: rate,
      commissionFee,
      total,
      status: 'draft',
    });

    const savedInvoice = await invoice.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: {
        invoice: savedInvoice,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('خطأ في إنشاء الفاتورة:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في إنشاء الفاتورة',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  } finally {
    session.endSession();
  }
}



static async updateInvoice(invoiceId, updateData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. التحقق من وجود الفاتورة
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      return { success: false, message: 'Invoice not found' };
    }

    // 2. حفظ المبلغ القديم لتحديث رصيد العميل
    const oldTotal = invoice.total;
    let newTotal = oldTotal;

    // 3. تحديث العناصر إذا وجدت
    if (updateData.items) {
      invoice.items = updateData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice // احتساب الـ total تلقائياً
      }));

      // 4. إعادة حساب المجاميع
      invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      invoice.commissionFee = invoice.subtotal * (invoice.commissionRate / 100);
      newTotal = invoice.subtotal + invoice.commissionFee;
      invoice.total = newTotal;
    }

    // 5. تحديث الحقول الأخرى
    const updatableFields = ['dueDate', 'paymentTerms', 'status', 'commissionRate'];
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        invoice[field] = field === 'dueDate' ? new Date(updateData[field]) : updateData[field];
      }
    });

    // 6. إذا تم تحديث commissionRate، إعادة حساب المجاميع
    if (updateData.commissionRate !== undefined) {
      invoice.commissionRate = updateData.commissionRate;
      invoice.commissionFee = invoice.subtotal * (invoice.commissionRate / 100);
      newTotal = invoice.subtotal + invoice.commissionFee;
      invoice.total = newTotal;
    }

    // 7. حفظ التغييرات
    const updatedInvoice = await invoice.save({ session });

    // 8. تحديث رصيد العميل إذا تغير المبلغ
    if (newTotal !== oldTotal) {
      const difference = newTotal - oldTotal;
      
      // جلب الطلب والعميل
      const purchaseOrder = await PurchaseOrder.findById(invoice.purchaseId)
        .populate({
          path: 'orderId',
          populate: {
            path: 'clientId'
          }
        })
        .session(session);

      if (purchaseOrder && purchaseOrder.orderId && purchaseOrder.orderId.clientId) {
        await Client.findByIdAndUpdate(
          purchaseOrder.orderId.clientId._id,
          { $inc: { InvoiceBalance: difference } },
          { session, new: true }
        );
      }
    }

    await session.commitTransaction();

    return {
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Update error:', error);
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
}

static async getInvoicesByClient(clientId) {
  try {
    // جلب جميع طلبات الشراء للعميل
    const purchaseOrders = await PurchaseOrder.find()
      .populate({
        path: 'orderId',
        match: { clientId: clientId }
      })
      .exec();

    const validPurchaseOrderIds = purchaseOrders
      .filter(po => po.orderId) // فقط الطلبات التي لها orderId
      .map(po => po._id);

    if (validPurchaseOrderIds.length === 0) {
      return {
        success: true,
        data: [],
        message: 'لا توجد فواتير لهذا العميل'
      };
    }

    // جلب الفواتير المرتبطة
    const invoices = await Invoice.find({
      purchaseId: { $in: validPurchaseOrderIds }
    })
    .populate({
      path: 'purchaseId',
      populate: {
        path: 'orderId',
        populate: {
          path: 'clientId',
          select: 'companyName InvoiceBalance Balance'
        }
      }
    })
    .sort({ createdAt: -1 });

    return {
      success: true,
      data: invoices.map(invoice => ({
        _id: invoice._id,
        purchaseId: invoice.purchaseId,
        orderId: invoice.orderId,
        dueDate: invoice.dueDate,
        paymentTerms: invoice.paymentTerms,
        items: invoice.items,
        subtotal: invoice.subtotal,
        commissionRate: invoice.commissionRate,
        commissionFee: invoice.commissionFee,
        total: invoice.total,
        status: invoice.status,
        clientInfo: invoice.purchaseId?.orderId?.clientId ? {
          companyName: invoice.purchaseId.orderId.clientId.companyName,
          InvoiceBalance: invoice.purchaseId.orderId.clientId.InvoiceBalance,
          Balance: invoice.purchaseId.orderId.clientId.Balance
        } : null,
        createdAt: invoice.createdAt
      }))
    };
  } catch (error) {
    console.error('خطأ في الحصول على فواتير العميل:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في الحصول على فواتير العميل'
    };
  }
}

static async getInvoiceStats() {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          averageAmount: { $avg: '$total' },
          draftInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          sentInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          overdueInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        success: true,
        data: {
          totalInvoices: 0,
          totalAmount: 0,
          averageAmount: 0,
          draftInvoices: 0,
          sentInvoices: 0,
          paidInvoices: 0,
          overdueInvoices: 0
        }
      };
    }

    return {
      success: true,
      data: {
        totalInvoices: stats[0].totalInvoices,
        totalAmount: Math.round(stats[0].totalAmount * 100) / 100,
        averageAmount: Math.round(stats[0].averageAmount * 100) / 100,
        draftInvoices: stats[0].draftInvoices,
        sentInvoices: stats[0].sentInvoices,
        paidInvoices: stats[0].paidInvoices,
        overdueInvoices: stats[0].overdueInvoices
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات الفواتير:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في الحصول على إحصائيات الفواتير'
    };
  }
}

static async updateInvoiceStatus(invoiceId, newStatus) {
  try {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        message: `الحالة غير صحيحة. الحالات المتاحة: ${validStatuses.join(', ')}`
      };
    }

    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: newStatus },
      { new: true }
    );

    if (!invoice) {
      return {
        success: false,
        message: 'الفاتورة غير موجودة'
      };
    }

    return {
      success: true,
      message: 'تم تحديث حالة الفاتورة بنجاح',
      data: invoice
    };
  } catch (error) {
    console.error('خطأ في تحديث حالة الفاتورة:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في تحديث حالة الفاتورة'
    };
  }
}

static async deleteInvoice(invoiceId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. التحقق من وجود الفاتورة
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      return { success: false, message: 'Invoice not found' };
    }

    // 2. جلب الطلب والعميل لتحديث الرصيد
    const purchaseOrder = await PurchaseOrder.findById(invoice.purchaseId)
      .populate({
        path: 'orderId',
        populate: {
          path: 'clientId'
        }
      })
      .session(session);

    if (purchaseOrder && purchaseOrder.orderId && purchaseOrder.orderId.clientId) {
      // 3. خصم مبلغ الفاتورة من رصيد العميل
      await Client.findByIdAndUpdate(
        purchaseOrder.orderId.clientId._id,
        { $inc: { InvoiceBalance: -invoice.total } },
        { session, new: true }
      );
    }

    // 4. حذف الفاتورة
    await Invoice.findByIdAndDelete(invoiceId).session(session);

    await session.commitTransaction();

    return {
      success: true,
      message: 'تم حذف الفاتورة بنجاح',
      data: {
        deletedInvoiceId: invoiceId,
        amountDeducted: invoice.total
      }
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Delete error:', error);
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
}

static async getClientInvoiceBalance(clientId) {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return {
        success: false,
        message: 'العميل غير موجود'
      };
    }

    return {
      success: true,
      data: {
        clientId: client._id,
        companyName: client.companyName,
        InvoiceBalance: client.InvoiceBalance,
        Balance: client.Balance
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على رصيد العميل:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في الحصول على رصيد العميل'
    };
  }
}

static async getAllInvoices() {
  try {
    const invoices = await Invoice.find()
      .populate({
        path: 'purchaseId',
        populate: {
          path: 'orderId',
          populate: {
            path: 'clientId',
            select: 'companyName InvoiceBalance Balance'
          }
        }
      })
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: invoices.map(invoice => ({
        _id: invoice._id,
        purchaseId: invoice.purchaseId,
        orderId: invoice.orderId,
        dueDate: invoice.dueDate,
        paymentTerms: invoice.paymentTerms,
        items: invoice.items,
        subtotal: invoice.subtotal,
        commissionRate: invoice.commissionRate,
        commissionFee: invoice.commissionFee,
        total: invoice.total,
        status: invoice.status,
        clientInfo: invoice.purchaseId?.orderId?.clientId ? {
          companyName: invoice.purchaseId.orderId.clientId.companyName,
          InvoiceBalance: invoice.purchaseId.orderId.clientId.InvoiceBalance,
          Balance: invoice.purchaseId.orderId.clientId.Balance
        } : null,
        createdAt: invoice.createdAt
      }))
    };
  } catch (error) {
    console.error('خطأ في الحصول على جميع الفواتير:', error.message);
    return {
      success: false,
      message: error.message || 'فشل في الحصول على الفواتير'
    };
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

const PurchaseOrder = require('../models/PurchaseOrder');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');

class PurchaseOrderService {
  // Create a new purchase order
  static async createPurchaseOrder(purchaseOrderData) {
    try {
      console.log('Creating new purchase order with data:', JSON.stringify(purchaseOrderData, null, 2));

      // Verify order exists
      const order = await Order.findById(purchaseOrderData.orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      console.log('Order found:', order.projectName);

      // Verify supplier exists
      const supplier = await Supplier.findById(purchaseOrderData.supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      console.log('Supplier found:', supplier.supplierName);

      // Calculate total amount from items
      const totalAmount = purchaseOrderData.items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        console.log(`Item: ${item.description}, Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${itemTotal}`);
        return sum + itemTotal;
      }, 0);
      console.log('Calculated total amount:', totalAmount);

      // Calculate paid amount from payment if provided
      const paidAmount = purchaseOrderData.payment ? purchaseOrderData.payment.amount : 0;
      console.log('Paid amount:', paidAmount);

      // Ensure items have calculated totals
      const processedItems = purchaseOrderData.items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0)
      }));

      // Create purchase order with supplier name
      const purchaseOrder = new PurchaseOrder({
        orderId: purchaseOrderData.orderId,
        supplierId: purchaseOrderData.supplierId,
        supplierName: supplier.supplierName,
        items: processedItems,
        paymentTerms: purchaseOrderData.paymentTerms,
        deliveryDate: new Date(purchaseOrderData.deliveryDate),
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        payments: purchaseOrderData.payment ? [{
          paymentType: purchaseOrderData.payment.paymentType,
          amount: purchaseOrderData.payment.amount,
          paymentDate: new Date(),
          paymentMethod: purchaseOrderData.payment.paymentMethod,
          reference: purchaseOrderData.payment.reference || '',
          status: 'completed',
          description: purchaseOrderData.payment.description || `${purchaseOrderData.payment.paymentType.replace('_', ' ')} payment for PO`
        }] : []
      });

      const savedPurchaseOrder = await purchaseOrder.save();
      console.log('Purchase order created successfully:', savedPurchaseOrder._id);

      // Update order workflow progress
      await Order.findByIdAndUpdate(purchaseOrderData.orderId, {
        hasPurchaseOrders: true,
        updatedAt: new Date()
      });
      console.log('Order workflow updated');

      return savedPurchaseOrder;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  // Get purchase orders by order ID
  static async getPurchaseOrdersByOrderId(orderId) {
    try {
      console.log('Fetching purchase orders for order:', orderId);

      const purchaseOrders = await PurchaseOrder.find({ orderId })
        .populate('supplierId', 'supplierName contactPerson email phone')
        .sort({ createdAt: -1 });

      console.log(`Found ${purchaseOrders.length} purchase orders for order ${orderId}`);
      return purchaseOrders;
    } catch (error) {
      console.error('Error fetching purchase orders by order ID:', error);
      throw error;
    }
  }

  // Get all purchase orders with pagination and filtering
  static async getPurchaseOrders(filters = {}) {
    try {
      console.log('Fetching purchase orders with filters:', filters);

      const { page = 1, limit = 10, status, supplierId, orderId } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (supplierId) query.supplierId = supplierId;
      if (orderId) query.orderId = orderId;

      console.log('Query built:', query);

      // Get purchase orders with pagination
      const purchaseOrders = await PurchaseOrder.find(query)
        .populate('orderId', 'projectName clientName')
        .populate('supplierId', 'supplierName contactPerson email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await PurchaseOrder.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      console.log(`Found ${purchaseOrders.length} purchase orders out of ${total} total`);

      return {
        purchaseOrders,
        total,
        page: parseInt(page),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  // Get single purchase order by ID
static async getPurchaseOrderById(purchaseOrderId) {
  try {
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId)
      .populate('orderId', 'projectName clientName commissionRate')
      .populate('supplierId', 'supplierName contactPerson email phone');

    if (!purchaseOrder) {
      return {
        success: false,
        message: 'Purchase order not found',
        data: null
      };
    }

    return {
      success: true,
      data: purchaseOrder
    };
  } catch (error) {
    console.error('Error fetching purchase order by ID:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch purchase order',
      data: null
    };
  }
}

  // Update purchase order
  static async updatePurchaseOrder(purchaseOrderId, updateData) {
    try {
      console.log('Updating purchase order:', purchaseOrderId, 'with data:', JSON.stringify(updateData, null, 2));

      // If items are being updated, recalculate totals
      if (updateData.items) {
        const totalAmount = updateData.items.reduce((sum, item) => {
          const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
          return sum + itemTotal;
        }, 0);

        // Process items with calculated totals
        updateData.items = updateData.items.map(item => ({
          ...item,
          total: (item.quantity || 0) * (item.unitPrice || 0)
        }));

        updateData.totalAmount = totalAmount;
        
        // Recalculate remaining amount if total changed
        const currentPO = await PurchaseOrder.findById(purchaseOrderId);
        if (currentPO) {
          updateData.remainingAmount = totalAmount - currentPO.paidAmount;
        }
      }

      const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        purchaseOrderId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('orderId', 'projectName clientName')
        .populate('supplierId', 'supplierName contactPerson email phone');

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      console.log('Purchase order updated successfully:', purchaseOrder._id);
      return purchaseOrder;
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  // Update purchase order status
  static async updatePurchaseOrderStatus(purchaseOrderId, status) {
    try {
      console.log('Updating purchase order status:', purchaseOrderId, 'to:', status);

      const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        purchaseOrderId,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('orderId', 'projectName clientName')
        .populate('supplierId', 'supplierName contactPerson email phone');

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      console.log('Purchase order status updated successfully:', purchaseOrder._id);
      return purchaseOrder;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  }

  // Delete purchase order
  static async deletePurchaseOrder(purchaseOrderId) {
    try {
      console.log('Deleting purchase order:', purchaseOrderId);

      const purchaseOrder = await PurchaseOrder.findByIdAndDelete(purchaseOrderId);

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Check if this was the last purchase order for the order
      const remainingPOs = await PurchaseOrder.countDocuments({ orderId: purchaseOrder.orderId });
      if (remainingPOs === 0) {
        await Order.findByIdAndUpdate(purchaseOrder.orderId, {
          hasPurchaseOrders: false,
          updatedAt: new Date()
        });
        console.log('Order workflow updated - no more purchase orders');
      }

      console.log('Purchase order deleted successfully:', purchaseOrderId);
      return { message: 'Purchase order deleted successfully' };
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // Create a payment for a purchase order
  static async createPurchaseOrderPayment(purchaseOrderId, paymentData) {
    try {
      console.log('Creating payment for purchase order:', purchaseOrderId, JSON.stringify(paymentData, null, 2));

      const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Check if payment amount exceeds remaining amount
      if (paymentData.amount > purchaseOrder.remainingAmount) {
        throw new Error(`Payment amount ($${paymentData.amount}) exceeds remaining balance ($${purchaseOrder.remainingAmount})`);
      }

      // Create new payment
      const newPayment = {
        paymentType: paymentData.paymentType,
        amount: paymentData.amount,
        paymentDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference || '',
        status: 'completed',
        description: paymentData.description || `${paymentData.paymentType.replace('_', ' ')} payment for PO`
      };

      // Add payment to purchase order
      purchaseOrder.payments.push(newPayment);

      // Update paid amount
      purchaseOrder.paidAmount += paymentData.amount;
      purchaseOrder.remainingAmount = purchaseOrder.totalAmount - purchaseOrder.paidAmount;
      purchaseOrder.updatedAt = new Date();

      const updatedPurchaseOrder = await purchaseOrder.save();
      const createdPayment = updatedPurchaseOrder.payments[updatedPurchaseOrder.payments.length - 1];

      console.log('Payment created successfully for purchase order:', purchaseOrderId);
      console.log('New payment amount:', paymentData.amount);
      console.log('Total paid amount:', updatedPurchaseOrder.paidAmount);
      console.log('Remaining amount:', updatedPurchaseOrder.remainingAmount);

      return {
        payment: createdPayment,
        purchaseOrder: updatedPurchaseOrder
      };
    } catch (error) {
      console.error('Error creating purchase order payment:', error);
      throw error;
    }
  }
}

module.exports = PurchaseOrderService;
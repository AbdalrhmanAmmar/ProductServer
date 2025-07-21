const Order = require('../models/Order');
const Client = require('../models/Client');
const PurchaseOrder = require('../models/PurchaseOrder');

class OrderService {
  // Create a new order
  static async createOrder(orderData) {
    try {
      console.log('Creating new order with data:', orderData);

      // Use provided clientName, or fallback
      const clientName = orderData.clientName || 'Unknown Client';

      // Create and save order
      const order = new Order({
        ...orderData,
        clientName
      });

      const savedOrder = await order.save();
      console.log('✅ Order created successfully:', savedOrder._id);

      return savedOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  // Get all orders with pagination and filtering (excluding archived)
  static async getOrders(filters = {}) {
    try {
      console.log('Fetching orders with filters:', filters);
      
      const { page = 1, limit = 10, status, clientId, workflowType, includeArchived = false } = filters;
      const skip = (page - 1) * limit;

      // Build query - exclude archived orders by default
      const query = { isArchived: includeArchived ? { $in: [true, false] } : false };
      if (status) query.status = status;
      if (clientId) query.clientId = clientId;
      if (workflowType) query.workflowType = workflowType;

      // Get orders with pagination
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('clientId', 'companyName');

      // Get total count for pagination
      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      console.log(`Found ${orders.length} orders out of ${total} total`);

      return {
        orders,
        total,
        page: parseInt(page),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get single order by ID (including archived)
static async getOrderById(orderId) {
  try {
    console.log('Fetching order by ID:', orderId);

    const order = await Order.findById(orderId).populate('clientId', 'companyName contactPerson email phone');
    if (!order) {
      throw new Error('Order not found');
    }

    // Fetch purchase orders related to this order
    const purchaseOrders = await PurchaseOrder.find({ orderId }).populate('supplierId', 'supplierName email phone');

    console.log('Order found:', order._id);
    return {
      order,
      purchaseOrders,
    };
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
}

  // Update order
  static async updateOrder(orderId, updateData) {
    try {
      console.log('Updating order:', orderId, 'with data:', updateData);
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('clientId', 'companyName');

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Order updated successfully:', order._id);
      return order;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    try {
      console.log('Updating order status:', orderId, 'to:', status);
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Order status updated successfully:', order._id);
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Archive order (soft delete)
  static async archiveOrder(orderId, userId = null) {
    try {
      console.log('Archiving order:', orderId);
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: userId,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Order archived successfully:', orderId);
      return { message: 'Order archived successfully', order };
    } catch (error) {
      console.error('Error archiving order:', error);
      throw error;
    }
  }

  // Restore archived order
  static async restoreOrder(orderId) {
    try {
      console.log('Restoring order:', orderId);
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 
          isArchived: false,
          archivedAt: null,
          archivedBy: null,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Order restored successfully:', orderId);
      return { message: 'Order restored successfully', order };
    } catch (error) {
      console.error('Error restoring order:', error);
      throw error;
    }
  }

  // Get archived orders
  static async getArchivedOrders(filters = {}) {
    try {
      console.log('Fetching archived orders with filters:', filters);
      
      const { page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      // Get only archived orders
      const query = { isArchived: true };

      const orders = await Order.find(query)
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('clientId', 'companyName')
        .populate('archivedBy', 'email');

      const total = await Order.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      console.log(`Found ${orders.length} archived orders out of ${total} total`);

      return {
        orders,
        total,
        page: parseInt(page),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching archived orders:', error);
      throw error;
    }
  }

  // Delete order (keep for admin use only - permanent delete)
  static async deleteOrder(orderId) {
    try {
      console.log('Permanently deleting order:', orderId);
      
      const order = await Order.findByIdAndDelete(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Order permanently deleted:', orderId);
      return { message: 'Order permanently deleted' };
    } catch (error) {
      console.error('Error permanently deleting order:', error);
      throw error;
    }
  }

  // Update workflow progress flags
  static async updateWorkflowProgress(orderId, progressData) {
    try {
      console.log('Updating workflow progress for order:', orderId, progressData);
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { ...progressData, updatedAt: new Date() },
        { new: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('Workflow progress updated successfully');
      return order;
    } catch (error) {
      console.error('Error updating workflow progress:', error);
      throw error;
    }
  }
}

module.exports = OrderService;
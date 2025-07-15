const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const PurchaseOrderService = require('../services/purchaseOrderService');
// const { requireUser } = require('./middleware/auth');

// Apply authentication middleware to all routes
// router.use(requireUser);

// Create a new order
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/orders - Creating new order');

    const orderData = req.body;

    // Validate required fields
    const requiredFields = ['clientId', 'projectName', 'workflowType', 'expectedDelivery', 'commissionRate', 'requirements'];
    const missingFields = requiredFields.filter(field => !orderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const order = await OrderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all orders with pagination and filtering
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/orders - Fetching orders list');

    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      clientId: req.query.clientId,
      workflowType: req.query.workflowType,
      includeArchived: req.query.includeArchived === 'true'
    };

    const result = await OrderService.getOrders(filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get archived orders
router.get('/archived', async (req, res) => {
  try {
    console.log('GET /api/orders/archived - Fetching archived orders');

    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await OrderService.getArchivedOrders(filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in GET /api/orders/archived:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get purchase orders for a specific order
router.get('/:id/purchase-orders', async (req, res) => {
  try {
    console.log('GET /api/orders/:id/purchase-orders - Fetching purchase orders for order');

    const { id } = req.params;
    const purchaseOrders = await PurchaseOrderService.getPurchaseOrdersByOrderId(id);

    res.status(200).json({
      success: true,
      data: { purchaseOrders }
    });
  } catch (error) {
    console.error('Error in GET /api/orders/:id/purchase-orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/orders/:id - Fetching order details');

    const { id } = req.params;
    const order = await OrderService.getOrderById(id);

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error in GET /api/orders/:id:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/orders/:id - Updating order');

    const { id } = req.params;
    const updateData = req.body;

    const order = await OrderService.updateOrder(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/:id:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    console.log('PUT /api/orders/:id/status - Updating order status');

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await OrderService.updateOrderStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/:id/status:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Archive order (soft delete)
router.put('/:id/archive', async (req, res) => {
  try {
    console.log('PUT /api/orders/:id/archive - Archiving order');

    const { id } = req.params;
    const userId = req.user?.id || null; // Get user ID from auth middleware

    const result = await OrderService.archiveOrder(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { order: result.order }
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/:id/archive:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Restore archived order
router.put('/:id/restore', async (req, res) => {
  try {
    console.log('PUT /api/orders/:id/restore - Restoring order');

    const { id } = req.params;
    const result = await OrderService.restoreOrder(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { order: result.order }
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/:id/restore:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Delete order (permanent delete - admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/orders/:id - Permanently deleting order');

    const { id } = req.params;
    const result = await OrderService.deleteOrder(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /api/orders/:id:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update workflow progress
router.put('/:id/workflow', async (req, res) => {
  try {
    console.log('PUT /api/orders/:id/workflow - Updating workflow progress');

    const { id } = req.params;
    const progressData = req.body;

    const order = await OrderService.updateWorkflowProgress(id, progressData);

    res.status(200).json({
      success: true,
      message: 'Workflow progress updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/:id/workflow:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const PurchaseOrderService = require('../services/purchaseOrderService');
const InvoiceService = require('../services/InvoiceService');
// const { requireUser } = require('./middleware/auth');

// Apply authentication middleware to all routes
// router.use(requireUser);

// Create a new purchase order
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/purchase-orders - Creating new purchase order');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const purchaseOrderData = req.body;

    // Validate required fields
    const requiredFields = ['orderId', 'supplierId', 'items', 'paymentTerms', 'deliveryDate'];
    const missingFields = requiredFields.filter(field => !purchaseOrderData[field]);

    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate items array
    if (!Array.isArray(purchaseOrderData.items) || purchaseOrderData.items.length === 0) {
      console.log('Validation failed - no items provided');
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < purchaseOrderData.items.length; i++) {
      const item = purchaseOrderData.items[i];
      if (!item.description || !item.quantity || !item.unitPrice) {
        console.log(`Validation failed - item ${i} missing required fields`);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields (description, quantity, unitPrice)`
        });
      }
    }

    console.log('Validation passed, creating purchase order...');
    const purchaseOrder = await PurchaseOrderService.createPurchaseOrder(purchaseOrderData);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    console.error('Error in POST /api/purchase-orders:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all purchase orders with pagination and filtering
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/purchase-orders - Fetching purchase orders list');
    console.log('Query parameters:', req.query);

    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      supplierId: req.query.supplierId,
      orderId: req.query.orderId
    };

    const result = await PurchaseOrderService.getPurchaseOrders(filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in GET /api/purchase-orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single purchase order by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/purchase-orders/:id - Fetching purchase order details');
    console.log('Purchase order ID:', req.params.id);

    const { id } = req.params;
    const purchaseOrder = await PurchaseOrderService.getPurchaseOrderById(id);

    res.status(200).json({
      success: true,
      data: { purchaseOrder }
    });
  } catch (error) {
    console.error('Error in GET /api/purchase-orders/:id:', error);
    const statusCode = error.message === 'Purchase order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update purchase order
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/purchase-orders/:id - Updating purchase order');
    console.log('Purchase order ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));

    const { id } = req.params;
    const updateData = req.body;

    // Validate items if provided
    if (updateData.items) {
      if (!Array.isArray(updateData.items) || updateData.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one item is required'
        });
      }

      // Validate each item
      for (let i = 0; i < updateData.items.length; i++) {
        const item = updateData.items[i];
        if (!item.description || !item.quantity || !item.unitPrice) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1} is missing required fields (description, quantity, unitPrice)`
          });
        }
      }
    }

    const purchaseOrder = await PurchaseOrderService.updatePurchaseOrder(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    console.error('Error in PUT /api/purchase-orders/:id:', error);
    const statusCode = error.message === 'Purchase order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update purchase order status
router.put('/:id/status', async (req, res) => {
  try {
    console.log('PUT /api/purchase-orders/:id/status - Updating purchase order status');
    console.log('Purchase order ID:', req.params.id);
    console.log('New status:', req.body.status);

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status value
    const validStatuses = ['draft', 'sent', 'confirmed', 'received'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const purchaseOrder = await PurchaseOrderService.updatePurchaseOrderStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Purchase order status updated successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    console.error('Error in PUT /api/purchase-orders/:id/status:', error);
    const statusCode = error.message === 'Purchase order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Delete purchase order
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/purchase-orders/:id - Deleting purchase order');
    console.log('Purchase order ID:', req.params.id);

    const { id } = req.params;
    const result = await PurchaseOrderService.deletePurchaseOrder(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /api/purchase-orders/:id:', error);
    const statusCode = error.message === 'Purchase order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Create a payment for a purchase order
router.post('/:id/payments', async (req, res) => {
  try {
    console.log('POST /api/purchase-orders/:id/payments - Creating purchase order payment');
    console.log('Purchase order ID:', req.params.id);
    console.log('Payment data:', JSON.stringify(req.body, null, 2));

    const { id } = req.params;
    const paymentData = req.body;

    // Validate required fields
    const requiredFields = ['paymentType', 'amount', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (paymentData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    // Validate payment type
    const validPaymentTypes = ['advance', 'down_payment', 'full_payment'];
    if (!validPaymentTypes.includes(paymentData.paymentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`
      });
    }

    // Validate payment method
    const validPaymentMethods = ['bank_transfer', 'wire', 'ach', 'check', 'cash'];
    if (!validPaymentMethods.includes(paymentData.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`
      });
    }

    const result = await PurchaseOrderService.createPurchaseOrderPayment(id, paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/purchase-orders/:id/payments:', error);
    const statusCode = error.message === 'Purchase order not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/order/:orderId', async (req, res) => {
  try {
    console.log('GET purchase orders by order ID:', req.params.orderId);
    
    const purchaseOrders = await PurchaseOrderService.getPurchaseOrdersByOrderId(
      req.params.orderId
    );

    res.status(200).json({
      success: true,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// GET /api/invoices/purchase/:purchaseId




module.exports = router;
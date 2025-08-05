const express = require('express');
const router = express.Router();
const ShippingService = require('../services/ShippingService');
const mongoose =require("mongoose")

// POST /api/shipping
router.post('/', async (req, res) => {
  try {
    const shippingData = req.body;
    
    // التحقق من صحة orderId
    if (!mongoose.Types.ObjectId.isValid(shippingData.orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Order ID format'
      });
    }

    // التحقق من وجود الطلب
    const orderExists = await mongoose.model('Order').exists({ _id: shippingData.orderId });
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const shippingInvoice = await ShippingService.createShippingInvoice(shippingData);
    
    res.status(201).json({
      success: true,
      message: 'Shipping invoice created successfully',
      data: shippingInvoice
    });
  } catch (error) {
    console.error('Error creating shipping invoice:', error);
    const statusCode = error.message.includes('Missing') || 
                      error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message || 'Failed to create shipping invoice'
    });
  }
});
// PUT /api/shipping/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await ShippingService.updateShippingInvoice(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Shipping invoice updated successfully',
      data: { invoice: updated }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.get('/:orderId', async (req, res) => {
  try {
    console.log(`GET /api/shipping/order/${req.params.orderId} - Fetching shipping invoices`);
    
    const shippingInvoices = await ShippingService.getShippingInvoicesByOrderId(
      req.params.orderId
    );

    res.status(200).json({
      success: true,
      message: shippingInvoices.length > 0 
        ? 'Shipping invoices retrieved successfully' 
        : 'No shipping invoices found for this order',
      data: shippingInvoices
    });
  } catch (error) {
    console.error('Error in GET /api/shipping/order/:orderId:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const ShippingService = require('../services/ShippingService');

// POST /api/shipping
router.post('/', async (req, res) => {
  try {
    const requiredFields = ['orderId', 'shippingCompanyName', 'trackingNumber', 'expectedDelivery', 'totalShippingCost'];
    const missing = requiredFields.filter(f => !req.body[f]);

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missing.join(', ')}`
      });
    }

    const invoice = await ShippingService.createShippingInvoice(req.body);

    res.status(201).json({
      success: true,
      message: 'Shipping invoice created successfully',
      data: { invoice }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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

module.exports = router;

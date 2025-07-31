const express = require('express');
const router = express.Router();
const InvoiceService = require('../services/InvoiceService');

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/invoices - Creating invoice');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const requiredFields = ['purchaseId', 'dueDate', 'paymentTerms'];
    const missing = requiredFields.filter(f => !req.body[f]);

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missing.join(', ')}`
      });
    }

    const invoice = await InvoiceService.createInvoice(req.body);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice },
    });
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    console.log(`PUT /api/invoices/${invoiceId} - Editing invoice`);

    const updatedInvoice = await InvoiceService.updateInvoice(invoiceId, req.body);

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    console.error(`Error in PUT /api/invoices/${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/invoices/:id
// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await InvoiceService.getInvoice(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invoice'
    });
  }
});


module.exports = router;

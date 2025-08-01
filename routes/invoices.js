const express = require('express');
const router = express.Router();
const InvoiceService = require('../services/InvoiceService');
const { mongoose } = require('mongoose');

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
    const { id } = req.params;
    
    // التحقق من صحة ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // التحقق من وجود بيانات التحديث
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided' });
    }

    const result = await InvoiceService.updateInvoice(id, req.body);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/invoices/:id
// GET /api/invoices/:id
// router.get('/:id', async (req, res) => {
//   try {
//     const result = await InvoiceService.getInvoice(req.params.id);
    
//     if (!result.success) {
//       return res.status(404).json(result);
//     }

//     res.status(200).json(result);
//   } catch (error) {
//     console.error('Error fetching invoice:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching invoice'
//     });
//   }
// });
router.get('/:purchaseId', async (req, res) => {
  try {
    const result = await InvoiceService.getInvoicesByPurchaseId(req.params.purchaseId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching invoices by purchase ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invoices'
    });
  }
});


module.exports = router;

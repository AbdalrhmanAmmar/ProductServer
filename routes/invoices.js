const express = require('express');
const router = express.Router();
const InvoiceService = require('../services/InvoiceService');
const { mongoose } = require('mongoose');

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/invoices - Creating invoice');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const requiredFields = ['purchaseId', 'dueDate', 'items'];

    const missing = requiredFields.filter(f => !req.body[f]);

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `الحقول المطلوبة ناقصة: ${missing.join(', ')}`
      });
    }

    // التحقق من أن items ليست فارغة
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يجب إضافة عنصر واحد على الأقل للفاتورة'
      });
    }

    const result = await InvoiceService.createInvoice(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: result.data,
    });
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ داخلي في الخادم'
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

// PATCH /api/invoices/:id/status - تحديث حالة الفاتورة
router.patch('/:id/status', async (req, res) => {
  try {
    console.log('PATCH /api/invoices/:id/status - Updating invoice status');
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await InvoiceService.updateInvoiceStatus(id, status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in PATCH /api/invoices/:id/status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/invoices/:id - Deleting invoice');
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    const result = await InvoiceService.deleteInvoice(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Error in DELETE /api/invoices/:id:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على رصيد العميل
router.get('/client-balance/:clientId', async (req, res) => {
  try {
    console.log('GET /api/invoices/client-balance/:clientId - Getting client balance');
    
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const result = await InvoiceService.getClientInvoiceBalance(clientId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم الحصول على رصيد العميل بنجاح',
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/invoices/client-balance/:clientId:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// GET /api/invoices/stats - الحصول على إحصائيات الفواتير
router.get('/stats', async (req, res) => {
  try {
    console.log('GET /api/invoices/stats - Getting invoice statistics');
    
    const result = await InvoiceService.getInvoiceStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم الحصول على إحصائيات الفواتير بنجاح',
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/invoices/stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// GET /api/invoices - الحصول على جميع الفواتير
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/invoices - Getting all invoices');
    
    const result = await InvoiceService.getAllInvoices();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم الحصول على الفواتير بنجاح',
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;

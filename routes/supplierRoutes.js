const express = require('express');
const router = express.Router();
const SupplierService = require('../services/supplierService');
const { requireUser } = require('./middleware/auth');

// Get all suppliers
router.get('/', requireUser, async (req, res) => {
  try {
    console.log('GET /api/suppliers - Fetching all suppliers');
    const suppliers = await SupplierService.getAllSuppliers();
    
    res.status(200).json({
      success: true,
      suppliers
    });
  } catch (error) {
    console.error('Error in GET /api/suppliers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new supplier
router.post('/', requireUser, async (req, res) => {
  try {
    console.log('POST /api/suppliers - Creating new supplier');
    const { supplierName } = req.body;

    if (!supplierName || !supplierName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const supplier = await SupplierService.createSupplier({
      supplierName: supplierName.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier
    });
  } catch (error) {
    console.error('Error in POST /api/suppliers:', error);
    const statusCode = error.message === 'Supplier with this name already exists' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Get single supplier
router.get('/:id', requireUser, async (req, res) => {
  try {
    console.log(`GET /api/suppliers/${req.params.id} - Fetching supplier`);
    const supplier = await SupplierService.getSupplierById(req.params.id);
    
    res.status(200).json({
      success: true,
      supplier
    });
  } catch (error) {
    console.error(`Error in GET /api/suppliers/${req.params.id}:`, error);
    const statusCode = error.message === 'Supplier not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Update supplier
router.put('/:id', requireUser, async (req, res) => {
  try {
    console.log(`PUT /api/suppliers/${req.params.id} - Updating supplier`);
    const { supplierName } = req.body;

    if (!supplierName || !supplierName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const supplier = await SupplierService.updateSupplier(req.params.id, {
      supplierName: supplierName.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error(`Error in PUT /api/suppliers/${req.params.id}:`, error);
    let statusCode = 500;
    if (error.message === 'Supplier not found') {
      statusCode = 404;
    } else if (error.message === 'Supplier with this name already exists') {
      statusCode = 409;
    }
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Delete supplier
router.delete('/:id', requireUser, async (req, res) => {
  try {
    console.log(`DELETE /api/suppliers/${req.params.id} - Deleting supplier`);
    const result = await SupplierService.deleteSupplier(req.params.id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(`Error in DELETE /api/suppliers/${req.params.id}:`, error);
    const statusCode = error.message === 'Supplier not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Get supplier statement
router.get('/:id/statement', requireUser, async (req, res) => {
  try {
    console.log(`GET /api/suppliers/${req.params.id}/statement - Fetching supplier statement`);
    const statement = await SupplierService.getSupplierStatement(req.params.id);
    
    res.status(200).json({
      success: true,
      statement
    });
  } catch (error) {
    console.error(`Error in GET /api/suppliers/${req.params.id}/statement:`, error);
    const statusCode = error.message === 'Supplier not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
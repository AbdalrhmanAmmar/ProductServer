const express = require('express');
const router = express.Router();
const SupplierService = require('../services/supplierService');
const mongoose = require("mongoose");
const Supplier = require('../models/Supplier');

// Get all suppliers
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.patch('/:id', async (req, res) => {
  try {
    console.log(`PATCH /api/suppliers/${req.params.id} - Updating supplier`);
    console.log('Update data:', req.body);

    const { id } = req.params;
    const updateData = req.body;

    // التحقق من صحة ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID'
      });
    }

    // تحديث المورد مع تشغيل التوثيق (validation) وإرجاع النسخة المحدثة
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log('Updated supplier:', supplier);
    
    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error(`Error in PATCH /api/suppliers/${req.params.id}:`, error);
    
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.message.includes('duplicate key')) {
      statusCode = 409;
      errorMessage = 'Supplier with this name already exists';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
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
router.get('/:id/statement', async (req, res) => {
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
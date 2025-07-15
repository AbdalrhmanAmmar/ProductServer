const express = require('express');
const router = express.Router();
const SeedService = require('../services/seedService');

// Seed admin user
router.post('/admin', async (req, res) => {
  try {
    console.log('Received request to seed admin user');
    const result = await SeedService.seedAdmin();
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('Error in seed admin route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Seed clients
router.post('/clients', async (req, res) => {
  try {
    console.log('Received request to seed clients');
    const result = await SeedService.seedClients();
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.clients || { count: result.count }
    });
  } catch (error) {
    console.error('Error in seed clients route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Seed suppliers
router.post('/suppliers', async (req, res) => {
  try {
    console.log('Received request to seed suppliers');
    const result = await SeedService.seedSuppliers();
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.suppliers || { count: result.count }
    });
  } catch (error) {
    console.error('Error in seed suppliers route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Seed orders
router.post('/orders', async (req, res) => {
  try {
    console.log('Received request to seed orders');
    const result = await SeedService.seedOrders();
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.orders || { count: result.count }
    });
  } catch (error) {
    console.error('Error in seed orders route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Seed all data
router.post('/all', async (req, res) => {
  try {
    console.log('Received request to seed all data');
    const result = await SeedService.seedAll();
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.results
    });
  } catch (error) {
    console.error('Error in seed all route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
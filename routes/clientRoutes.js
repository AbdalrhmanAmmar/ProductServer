const express = require('express');
const router = express.Router();
const clientService = require('../services/clientService');

// Apply authentication middleware to all routes

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await clientService.getAllClients();
    res.status(200).json({
      success: true,
      clients: clients
    });
  } catch (error) {
    console.error('Error in GET /api/clients:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/clients - Create a new client
router.post('/', async (req, res) => {
  try {
    const { companyName, contactPerson, email, phone, country } = req.body;

    // Validate required fields
    if (!companyName || !contactPerson || !email || !phone || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: companyName, contactPerson, email, phone, country'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const client = await clientService.createClient({
      companyName,
      contactPerson,
      email,
      phone,
      country
    });

    res.status(201).json({
      success: true,
      client: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/clients:', error.message);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.getClientById(id);
    
    res.status(200).json({
      success: true,
      client: client
    });
  } catch (error) {
    console.error('Error in GET /api/clients/:id:', error.message);
    
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/clients/:id - Update client
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactPerson, email, phone, country,InvoiceBalance } = req.body;

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;
    if(InvoiceBalance) updateData.InvoiceBalance=InvoiceBalance;

    const client = await clientService.updateClient(id, updateData);
    
    res.status(200).json({
      success: true,
      client: client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/clients/:id:', error.message);
    
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.deleteClient(id);
    
    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
      client: client
    });
  } catch (error) {
    console.error('Error in DELETE /api/clients/:id:', error.message);
    
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/clients/:id/statement - Get client statement
router.get('/:id/statement', async (req, res) => {
  try {
    const { id } = req.params;
    const statement = await clientService.getClientStatement(id);
    
    res.status(200).json({
      success: true,
      statement: statement
    });
  } catch (error) {
    console.error('Error in GET /api/clients/:id/statement:', error.message);
    
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
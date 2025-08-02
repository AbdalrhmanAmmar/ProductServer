const express = require('express');
const router = express.Router();
const ShippingCompanyService = require('../services/ShippingCompanyService');

// Create shipping company
router.post('/', async (req, res) => {
  try {
    if (!req.body.companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const company = await ShippingCompanyService.createCompany(req.body.companyName);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all shipping companies
router.get('/', async (req, res) => {
  try {
    const companies = await ShippingCompanyService.getCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const AccountingService = require('../services/accountingService');

/**
 * @swagger
 * tags:
 *   name: Accounting
 *   description: Financial account management
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [asset, liability, equity, revenue, expense]
 *         description: Filter by account type
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Account'
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filters = type ? { accountType: type } : {};
    
    const accounts = await AccountingService.getAccounts(filters);
    
    res.json({
      success: true,
      data: { accounts }
    });
    
  } catch (error) {
    console.error('Error in GET /accounts:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewAccount'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 */
router.post('/', async (req, res) => {
  try {
    const accountData = req.body;
    
    // Basic validation
    if (!accountData.accountNumber || !accountData.accountName || !accountData.accountType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: accountNumber, accountName, accountType'
      });
    }
    
    const account = await AccountingService.createAccount(accountData);
    
    res.status(201).json({
      success: true,
      data: { account }
    });
    
  } catch (error) {
    console.error('Error in POST /accounts:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 */
router.get('/:id', async (req, res) => {
  try {
    const account = await AccountingService.getAccountById(req.params.id);
    
    res.json({
      success: true,
      data: { account }
    });
    
  } catch (error) {
    console.error('Error in GET /accounts/:id:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
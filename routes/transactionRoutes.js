const express = require('express');
const router = express.Router();
const TransactionService = require('../services/transactionService');
const { check } = require('express-validator');
const { validate } = require('../models/Transaction');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial transaction management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions with optional filtering
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, posted, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for description, reference, or transaction number
 *     responses:
 *       200:
 *         description: List of transactions
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, status, startDate, endDate, search } = req.query;
    
    const transactions = await TransactionService.getTransactions({
      page,
      limit,
      status,
      startDate,
      endDate,
      search
    });
    
    res.json({
      success: true,
      data: transactions
    });
    
  } catch (error) {
    console.error('Error in GET /transactions:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewTransaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 */
router.post(
  '/',

  async (req, res, next) => {
    try {
      // Ensure each entry has either debit or credit
      req.body.entries.forEach(entry => {
        if ((entry.debit && entry.credit) || (!entry.debit && !entry.credit)) {
          throw new Error('Each entry must have either a debit or credit amount (not both or neither)');
        }
      });

      const transaction = await TransactionService.createTransaction(
        req.body,

      );
      
      res.status(201).json({
        success: true,
        data: { transaction }
      });
      
    } catch (error) {
      console.error('Error in POST /transactions:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 */
router.get('/:id', async (req, res) => {
  try {
    const transaction = await TransactionService.getTransactionById(req.params.id);
    
    res.json({
      success: true,
      data: { transaction }
    });
    
  } catch (error) {
    console.error('Error in GET /transactions/:id:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /transactions/{id}/status:
 *   patch:
 *     summary: Update transaction status
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, posted, cancelled]
 *                 description: New status for the transaction
 *     responses:
 *       200:
 *         description: Transaction status updated
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 */
router.patch(
  '/:id/status', 


  async (req, res) => {
    try {
      const transaction = await TransactionService.updateTransactionStatus(
        req.params.id,
        req.body.status,
        req.user.id
      );
      
      res.json({
        success: true,
        data: { transaction }
      });
      
    } catch (error) {
      console.error('Error in PATCH /transactions/:id/status:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       204:
 *         description: Transaction deleted successfully
 */
router.delete(
  '/:id', 
  async (req, res) => {
    try {
      await TransactionService.deleteTransaction(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error('Error in DELETE /transactions/:id:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
const express = require('express');
const router = express.Router();
const bankingService = require('../services/bankingService');

// Apply authentication middleware to all routes (uncomment when auth is implemented)
// router.use(authMiddleware);

// ========== BANK ACCOUNTS ==========

// GET /api/banking/accounts - Get all bank accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await bankingService.getAllBankAccounts();
    res.status(200).json({
      success: true,
      accounts: accounts
    });
  } catch (error) {
    console.error('Error in GET /api/banking/accounts:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/banking/accounts - Create a new bank account
router.post('/accounts', async (req, res) => {
  try {
    const { accountName, bankName, accountNumber, routingNumber, accountType, balance, currency, description, allowOverdraft } = req.body;

    // Validate required fields
    if (!accountName || !bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: accountName, bankName, accountNumber'
      });
    }

    const account = await bankingService.createBankAccount({
      accountName,
      bankName,
      accountNumber,
      routingNumber,
      accountType,
      balance: balance || 0,
      currency: currency || 'USD',
      description,
      allowOverdraft: allowOverdraft || false
    });

    res.status(201).json({
      success: true,
      account: account,
      message: 'Bank account created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/accounts:', error.message);
    
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

// GET /api/banking/accounts/:id - Get bank account by ID
router.get('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await bankingService.getBankAccountById(id);
    
    res.status(200).json({
      success: true,
      account: account
    });
  } catch (error) {
    console.error('Error in GET /api/banking/accounts/:id:', error.message);
    
    if (error.message === 'Bank account not found') {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/banking/accounts/:id - Update bank account
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, bankName, accountNumber, routingNumber, accountType, description, allowOverdraft } = req.body;

    const updateData = {};
    if (accountName) updateData.accountName = accountName;
    if (bankName) updateData.bankName = bankName;
    if (accountNumber) updateData.accountNumber = accountNumber;
    if (routingNumber) updateData.routingNumber = routingNumber;
    if (accountType) updateData.accountType = accountType;
    if (description !== undefined) updateData.description = description;
    if (allowOverdraft !== undefined) updateData.allowOverdraft = allowOverdraft;

    const account = await bankingService.updateBankAccount(id, updateData);
    
    res.status(200).json({
      success: true,
      account: account,
      message: 'Bank account updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/banking/accounts/:id:', error.message);
    
    if (error.message === 'Bank account not found') {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
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

// DELETE /api/banking/accounts/:id - Deactivate bank account
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await bankingService.deactivateBankAccount(id);
    
    res.status(200).json({
      success: true,
      message: 'Bank account deactivated successfully',
      account: account
    });
  } catch (error) {
    console.error('Error in DELETE /api/banking/accounts/:id:', error.message);
    
    if (error.message === 'Bank account not found') {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== TRANSACTIONS ==========

// GET /api/banking/transactions - Get all transactions (with optional filters)
router.get('/transactions', async (req, res) => {
  try {
    const { accountId, type, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    const filter = {};
    if (accountId) filter.accountId = accountId;
    if (type) filter.transactionType = type;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await bankingService.getTransactions(filter, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error in GET /api/banking/transactions:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/banking/accounts/:id/transactions - Get transactions for a bank account
router.get('/accounts/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const transactions = await bankingService.getBankTransactions(id, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error in GET /api/banking/accounts/:id/transactions:', error.message);
    
    if (error.message === 'Bank account not found') {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/banking/transactions/:id - Get transaction by ID
router.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await bankingService.getTransactionById(id);
    
    res.status(200).json({
      success: true,
      transaction: transaction
    });
  } catch (error) {
    console.error('Error in GET /api/banking/transactions/:id:', error.message);
    
    if (error.message === 'Transaction not found') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/banking/send-money - Send money (withdrawal/transfer)
router.post('/send-money', async (req, res) => {
  try {
    const { accountId, recipientType, recipientId, amount, description, paymentMethod, reference } = req.body;

    // Validate required fields
    if (!accountId || !recipientType || !recipientId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: accountId, recipientType, recipientId, amount, description'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Validate recipient type
    if (!['customer', 'supplier'].includes(recipientType)) {
      return res.status(400).json({
        success: false,
        message: 'Recipient type must be either customer or supplier'
      });
    }

    const transaction = await bankingService.sendMoney({
      accountId,
      recipientType,
      recipientId,
      amount: parseFloat(amount),
      description,
      paymentMethod,
      reference
    });

    res.status(201).json({
      success: true,
      transaction: transaction,
      message: 'Payment sent successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/send-money:', error.message);
    
    if (error.message === 'Insufficient funds') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in the account'
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
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

// POST /api/banking/receive-money - Receive money (deposit)
router.post('/receive-money', async (req, res) => {
  try {
    const { accountId, customerId, amount, description, paymentMethod, reference } = req.body;

    // Validate required fields
    if (!accountId || !customerId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: accountId, customerId, amount, description'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const transaction = await bankingService.receiveMoney({
      accountId,
      customerId,
      amount: parseFloat(amount),
      description,
      paymentMethod,
      reference
    });

    res.status(201).json({
      success: true,
      transaction: transaction,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/receive-money:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
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

// POST /api/banking/internal-transfer - Internal transfer between accounts
router.post('/internal-transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description, reference } = req.body;

    // Validate required fields
    if (!fromAccountId || !toAccountId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: fromAccountId, toAccountId, amount, description'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Prevent transferring to same account
    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to the same account'
      });
    }

    const result = await bankingService.internalTransfer({
      fromAccountId,
      toAccountId,
      amount: parseFloat(amount),
      description,
      reference
    });

    res.status(201).json({
      success: true,
      transactions: result.transactions,
      message: 'Transfer completed successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/internal-transfer:', error.message);
    
    if (error.message === 'Insufficient funds') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in the source account'
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
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

// ========== BALANCES ==========

// GET /api/banking/customer-balances - Get all customer balances
router.get('/customer-balances', async (req, res) => {
  try {
    const balances = await bankingService.getCustomerBalances();
    res.status(200).json({
      success: true,
      balances: balances
    });
  } catch (error) {
    console.error('Error in GET /api/banking/customer-balances:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/banking/supplier-balances - Get all supplier balances
router.get('/supplier-balances', async (req, res) => {
  try {
    const balances = await bankingService.getSupplierBalances();
    res.status(200).json({
      success: true,
      balances: balances
    });
  } catch (error) {
    console.error('Error in GET /api/banking/supplier-balances:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/banking/customer-balances/:id - Get customer balance by ID
router.get('/customer-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const balance = await bankingService.getCustomerBalanceById(id);
    
    res.status(200).json({
      success: true,
      balance: balance
    });
  } catch (error) {
    console.error('Error in GET /api/banking/customer-balances/:id:', error.message);
    
    if (error.message === 'Customer balance not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer balance not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/banking/supplier-balances/:id - Get supplier balance by ID
router.get('/supplier-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const balance = await bankingService.getSupplierBalanceById(id);
    
    res.status(200).json({
      success: true,
      balance: balance
    });
  } catch (error) {
    console.error('Error in GET /api/banking/supplier-balances/:id:', error.message);
    
    if (error.message === 'Supplier balance not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier balance not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/banking/customer-balances/:id - Update customer balance
router.put('/customer-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { outstandingChange = 0, paymentAmount = 0 } = req.body;

    const balance = await bankingService.updateCustomerBalance(
      id, 
      parseFloat(outstandingChange), 
      parseFloat(paymentAmount)
    );
    
    res.status(200).json({
      success: true,
      balance: balance,
      message: 'Customer balance updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/banking/customer-balances/:id:', error.message);
    
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/banking/supplier-balances/:id - Update supplier balance
router.put('/supplier-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { outstandingChange = 0, paymentAmount = 0 } = req.body;

    const balance = await bankingService.updateSupplierBalance(
      id, 
      parseFloat(outstandingChange), 
      parseFloat(paymentAmount)
    );
    
    res.status(200).json({
      success: true,
      balance: balance,
      message: 'Supplier balance updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/banking/supplier-balances/:id:', error.message);
    
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/banking/sync-balances - Sync customer and supplier balances
router.post('/sync-balances', async (req, res) => {
  try {
    await Promise.all([
      bankingService.syncCustomerBalances(),
      bankingService.syncSupplierBalances()
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Balances synced successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/sync-balances:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== RECONCILIATION ==========

// POST /api/banking/reconcile/:accountId - Reconcile bank account
router.post('/reconcile/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { statementBalance, statementDate } = req.body;

    if (!statementBalance || !statementDate) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: statementBalance, statementDate'
      });
    }

    const reconciliation = await bankingService.reconcileAccount(
      accountId,
      parseFloat(statementBalance),
      new Date(statementDate)
    );
    
    res.status(200).json({
      success: true,
      reconciliation: reconciliation,
      message: 'Account reconciled successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/banking/reconcile/:accountId:', error.message);
    
    if (error.message === 'Bank account not found') {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    if (error.message.includes('does not match')) {
      return res.status(400).json({
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

module.exports = router;
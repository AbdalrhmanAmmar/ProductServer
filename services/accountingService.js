const Account = require('../models/Account');

class AccountingService {
  /**
   * Create a new account
   * @param {Object} accountData - Account data including number, name, type, etc.
   * @returns {Promise<Object>} Created account
   */
  static async createAccount(accountData) {
    try {
      console.log('Creating new account:', accountData);

      // Validate required fields
      if (!accountData.accountNumber || !accountData.accountName || !accountData.accountType) {
        throw new Error('Missing required fields: accountNumber, accountName, accountType');
      }

      // Check for duplicate account number
      const existingAccount = await Account.findOne({ accountNumber: accountData.accountNumber });
      if (existingAccount) {
        throw new Error(`Account number ${accountData.accountNumber} already exists`);
      }

      // Create and save account
      const account = new Account({
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName,
        accountType: accountData.accountType,
        description: accountData.description || '',
        balance: accountData.balance, // New accounts start with 0 balance
        isActive: true
      });

      const savedAccount = await account.save();
      console.log('Account created successfully:', savedAccount._id);
      return savedAccount;

    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Get all accounts with optional filtering
   * @param {Object} filters - Optional filters (type, active status, etc.)
   * @returns {Promise<Array>} List of accounts
   */
  static async getAccounts(filters = {}) {
    try {
      console.log('Fetching accounts with filters:', filters);

      // Default to only active accounts unless specified
      const query = { isActive: true, ...filters };

      const accounts = await Account.find(query)
        .sort({ accountNumber: 1 })
        .lean();

      console.log(`Found ${accounts.length} accounts`);
      return accounts;

    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get account by ID
   * @param {String} accountId - MongoDB account ID
   * @returns {Promise<Object>} Account details
   */
  static async getAccountById(accountId) {
    try {
      console.log('Fetching account by ID:', accountId);

      const account = await Account.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      return account;

    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  /**
   * Update account balance (used for transactions)
   * @param {String} accountId - Account ID to update
   * @param {Number} amount - Amount to adjust
   * @param {String} operation - 'debit' or 'credit'
   * @returns {Promise<Object>} Updated account
   */
  static async updateAccountBalance(accountId, amount, operation) {
    try {
      console.log(`Updating account ${accountId} balance: ${operation} ${amount}`);

      // Validate operation type
      if (!['debit', 'credit'].includes(operation)) {
        throw new Error('Invalid operation. Must be "debit" or "credit"');
      }

      // Determine the update direction
      const updateAmount = operation === 'debit' ? Math.abs(amount) : -Math.abs(amount);

      const updatedAccount = await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: updateAmount } },
        { new: true }
      );

      if (!updatedAccount) {
        throw new Error('Account not found');
      }

      console.log('Account balance updated. New balance:', updatedAccount.balance);
      return updatedAccount;

    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }
}

module.exports = AccountingService;
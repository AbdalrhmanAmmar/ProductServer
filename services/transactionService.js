const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

class TransactionService {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data including entries, date, description
   * @param {String} userId - User ID creating the transaction
   * @returns {Promise<Object>} Created transaction
   */
  static async createTransaction(transactionData, userId) {
    try {
      console.log('Creating new transaction:', transactionData);

      // Validate required fields
      if (!transactionData.date || !transactionData.description || !transactionData.entries) {
        throw new Error('Missing required fields: date, description, entries');
      }

      // Validate entries array has at least 2 items
      if (transactionData.entries.length < 2) {
        throw new Error('Transaction must have at least 2 entries');
      }

      // Validate debits equal credits
      const totalDebits = transactionData.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredits = transactionData.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Total debits must equal total credits');
      }

      // Validate each entry has either debit or credit (not both or neither)
      const hasInvalidEntries = transactionData.entries.some(entry =>
        (entry.debit > 0 && entry.credit > 0) || (entry.debit === 0 && entry.credit === 0)
      );

      if (hasInvalidEntries) {
        throw new Error('Each entry must have either a debit or credit amount (not both or neither)');
      }

      // Lookup account names for each entry
      const entriesWithAccountNames = await Promise.all(
        transactionData.entries.map(async (entry) => {
          const account = await Account.findById(entry.accountId);
          if (!account) {
            throw new Error(`Account not found for ID: ${entry.accountId}`);
          }
          return {
            ...entry,
            accountName: account.accountName
          };
        })
      );

      // Calculate total amount (sum of all debits)
      const totalAmount = entriesWithAccountNames.reduce((sum, entry) => sum + entry.debit, 0);

      // Create and save transaction
      const transaction = new Transaction({
        ...transactionData,
        entries: entriesWithAccountNames,
        totalAmount,
        createdBy: userId,
        status: transactionData.status || 'posted'
      });

      const savedTransaction = await transaction.save();
      console.log('Transaction created successfully:', savedTransaction._id);
      return savedTransaction;

    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get all transactions with optional filtering
   * @param {Object} filters - Optional filters (status, date range, search term)
   * @returns {Promise<Array>} List of transactions
   */
  static async getTransactions(filters = {}) {
    try {
      console.log('Fetching transactions with filters:', filters);

      const { page = 1, limit = 10, status, startDate, endDate, search } = filters;
      const query = {};

      if (status) query.status = status;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      if (search) {
        query.$or = [
          { transactionNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { reference: { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { date: -1, createdAt: -1 },
        populate: { path: 'createdBy', select: 'name email' }
      };

      const result = await Transaction.paginate(query, options);
      console.log(`Found ${result.totalDocs} transactions`);
      return result;

    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * @param {String} transactionId - MongoDB transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  static async getTransactionById(transactionId) {
    try {
      console.log('Fetching transaction by ID:', transactionId);

      const transaction = await Transaction.findById(transactionId)
        .populate({ path: 'createdBy', select: 'name email' })
        .populate({ path: 'entries.accountId', select: 'accountNumber accountName accountType' });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;

    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   * @param {String} transactionId - Transaction ID to update
   * @param {String} status - New status ('draft', 'posted', 'cancelled')
   * @param {String} userId - User ID making the change
   * @returns {Promise<Object>} Updated transaction
   */
  static async updateTransactionStatus(transactionId, status, userId) {
    try {
      console.log(`Updating transaction ${transactionId} status to ${status}`);

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === status) {
        return transaction; // No change needed
      }

      // Additional validation for status changes
      if (status === 'cancelled' && transaction.status === 'posted') {
        // When cancelling a posted transaction, reverse the entries
        await this.reverseTransactionEntries(transaction);
      } else if (status === 'posted' && transaction.status === 'cancelled') {
        // When posting a cancelled transaction, re-apply the entries
        await this.applyTransactionEntries(transaction);
      }

      transaction.status = status;
      transaction.updatedBy = userId;
      const updatedTransaction = await transaction.save();

      console.log('Transaction status updated successfully');
      return updatedTransaction;

    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Helper method to reverse transaction entries (for cancellation)
   * @param {Object} transaction - Transaction document
   */
  static async reverseTransactionEntries(transaction) {
    try {
      console.log('Reversing transaction entries for:', transaction._id);

      for (const entry of transaction.entries) {
        const account = await Account.findById(entry.accountId);
        if (!account) continue;

        if (entry.debit > 0) {
          const isDebitIncrease = ['asset', 'expense'].includes(account.accountType);
          account.balance += isDebitIncrease ? -entry.debit : entry.debit;
        } else if (entry.credit > 0) {
          const isCreditIncrease = ['liability', 'equity', 'revenue'].includes(account.accountType);
          account.balance += isCreditIncrease ? -entry.credit : entry.credit;
        }

        await account.save();
      }

      console.log('Transaction entries reversed successfully');
    } catch (error) {
      console.error('Error reversing transaction entries:', error);
      throw error;
    }
  }

  /**
   * Helper method to apply transaction entries (for posting)
   * @param {Object} transaction - Transaction document
   */
  static async applyTransactionEntries(transaction) {
    try {
      console.log('Applying transaction entries for:', transaction._id);

      for (const entry of transaction.entries) {
        const account = await Account.findById(entry.accountId);
        if (!account) continue;

        if (entry.debit > 0) {
          const isDebitIncrease = ['asset', 'expense'].includes(account.accountType);
          account.balance += isDebitIncrease ? entry.debit : -entry.debit;
        } else if (entry.credit > 0) {
          const isCreditIncrease = ['liability', 'equity', 'revenue'].includes(account.accountType);
          account.balance += isCreditIncrease ? entry.credit : -entry.credit;
        }

        await account.save();
      }

      console.log('Transaction entries applied successfully');
    } catch (error) {
      console.error('Error applying transaction entries:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   * @param {String} transactionId - Transaction ID to delete
   * @returns {Promise<Object>} Deleted transaction
   */
  static async deleteTransaction(transactionId) {
    try {
      console.log('Deleting transaction:', transactionId);

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'posted') {
        throw new Error('Cannot delete a posted transaction. Cancel it first.');
      }

      const deletedTransaction = await transaction.remove();
      console.log('Transaction deleted successfully');
      return deletedTransaction;

    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

module.exports = TransactionService;
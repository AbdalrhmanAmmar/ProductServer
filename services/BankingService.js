const { BankAccount, BankTransaction, CustomerBalance, SupplierBalance } = require('../models/Banking');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');

class BankingService {
  // ========== BANK ACCOUNTS ==========
  
  // Create a new bank account
  async createBankAccount(accountData) {
    try {
      console.log('Creating new bank account:', accountData.accountName);
      
      // Check if account number already exists
      const existingAccount = await BankAccount.findOne({ accountNumber: accountData.accountNumber });
      if (existingAccount) {
        throw new Error('Account number already exists');
      }

      const account = new BankAccount(accountData);
      await account.save();
      
      console.log('Bank account created successfully:', account._id);
      return account;
    } catch (error) {
      console.error('Error creating bank account:', error.message);
      throw error;
    }
  }

  // Get all bank accounts
  async getAllBankAccounts() {
    try {
      console.log('Fetching all bank accounts');
      const accounts = await BankAccount.find({ isActive: true }).sort({ createdAt: -1 });
      console.log(`Found ${accounts.length} bank accounts`);
      return accounts;
    } catch (error) {
      console.error('Error fetching bank accounts:', error.message);
      throw error;
    }
  }

  // Get bank account by ID
  async getBankAccountById(accountId) {
    try {
      console.log('Fetching bank account by ID:', accountId);
      const account = await BankAccount.findById(accountId);
      
      if (!account) {
        throw new Error('Bank account not found');
      }
      
      console.log('Bank account found:', account.accountName);
      return account;
    } catch (error) {
      console.error('Error fetching bank account:', error.message);
      throw error;
    }
  }

  // Update bank account
  async updateBankAccount(accountId, updateData) {
    try {
      console.log('Updating bank account:', accountId);
      
      // Check if account number is being updated and if it conflicts
      if (updateData.accountNumber) {
        const existingAccount = await BankAccount.findOne({ 
          accountNumber: updateData.accountNumber, 
          _id: { $ne: accountId } 
        });
        if (existingAccount) {
          throw new Error('Account number already exists');
        }
      }

      const account = await BankAccount.findByIdAndUpdate(
        accountId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!account) {
        throw new Error('Bank account not found');
      }

      console.log('Bank account updated successfully:', account.accountName);
      return account;
    } catch (error) {
      console.error('Error updating bank account:', error.message);
      throw error;
    }
  }

  // Deactivate bank account (soft delete)
  async deactivateBankAccount(accountId) {
    try {
      console.log('Deactivating bank account:', accountId);
      
      const account = await BankAccount.findByIdAndUpdate(
        accountId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      if (!account) {
        throw new Error('Bank account not found');
      }

      console.log('Bank account deactivated successfully:', account.accountName);
      return account;
    } catch (error) {
      console.error('Error deactivating bank account:', error.message);
      throw error;
    }
  }

  // ========== TRANSACTIONS ==========

  // Get transactions for a bank account
  async getBankTransactions(accountId, limit = 100, offset = 0) {
    try {
      console.log('Fetching transactions for account:', accountId);
      
      // Verify account exists
      const account = await BankAccount.findById(accountId);
      if (!account) {
        throw new Error('Bank account not found');
      }

      const transactions = await BankTransaction.find({ accountId })
        .populate('customerId', 'companyName')
        .populate('supplierId', 'supplierName')
        .sort({ transactionDate: -1 })
        .limit(limit)
        .skip(offset);

      console.log(`Found ${transactions.length} transactions for account`);
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      throw error;
    }
  }

  // Send money (withdrawal/transfer)
// Send money (withdrawal/transfer)
async sendMoney(transactionData) {
  try {
    const { accountId, customerId, supplierId, amount, description, paymentMethod, reference } = transactionData;

    // التحقق من الحقول المطلوبة
    if (!accountId || !amount || !description) {
      throw new Error('Required fields: accountId, amount, description');
    }
    
    // التحقق من وجود أحد المعرفات (customerId أو supplierId)
    if (!(customerId || supplierId)) {
      throw new Error('Either customerId or supplierId is required');
    }

    // التحقق من وجود الحساب البنكي ورصيده
    const account = await BankAccount.findById(accountId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    if (account.balance < amount) {
      throw new Error('Insufficient funds');
    }

    let recipient;
    let recipientType;
    let recipientModel;
    
    // تحديد نوع المستلم ونموذجه
    if (customerId) {
      recipient = await Client.findById(customerId);
      recipientType = 'customer';
      recipientModel = 'Client';
      if (!recipient) {
        throw new Error('Customer not found');
      }
    } else {
      recipient = await Supplier.findById(supplierId);
      recipientType = 'supplier';
      recipientModel = 'Supplier';
      if (!recipient) {
        throw new Error('Supplier not found');
      }
    }

    // إنشاء المعاملة
    const transaction = new BankTransaction({
      accountId,
      transactionType: 'withdrawal',
      amount,
      description,
      reference,
      paymentMethod: paymentMethod || 'bank_transfer',
      customerId: customerId || null,
      supplierId: supplierId || null,
      status: 'completed'
    });

    await transaction.save();

    // تحديث رصيد المستلم حسب نوعه
    if (recipientType === 'customer') {
      recipient.Balance -= amount; // سحب من العميل
    } else {
      recipient.Balance += amount; // إضافة للمورد
    }
    
    await recipient.save();

    // تحديث رصيد الحساب البنكي (الخصم)
    account.balance -= amount;
    await account.save();

    console.log(`Send money transaction to ${recipientType} (${recipientModel}) completed successfully`);
    return transaction;
  } catch (error) {
    console.error('Error processing send money:', error.message);
    throw error;
  }
}
// Receive money (deposit)
async receiveMoney(transactionData) {
  try {
    const { accountId, customerId, supplierId, amount, description, paymentMethod, reference } = transactionData;

    // التحقق من الحقول المطلوبة
    if (!accountId || !amount || !description) {
      throw new Error('Required fields: accountId, amount, description');
    }
    
    // التحقق من وجود أحد المعرفات (customerId أو supplierId)
    if (!customerId && !supplierId) {
      throw new Error('Either customerId or supplierId is required');
    }

    // التحقق من وجود الحساب البنكي
    const account = await BankAccount.findById(accountId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    let recipient;
    let recipientType;
    let recipientModel;
    
    // تحديد نوع المستلم ونموذجه
    if (customerId) {
      recipient = await Client.findById(customerId);
      recipientType = 'customer';
      recipientModel = 'Client';
      if (!recipient) {
        throw new Error('Customer not found');
      }
    } else {
      recipient = await Supplier.findById(supplierId);
      recipientType = 'supplier';
      recipientModel = 'Supplier';
      if (!recipient) {
        throw new Error('Supplier not found');
      }
    }

    // إنشاء المعاملة
    const transaction = new BankTransaction({
      accountId,
      transactionType: 'deposit',
      amount,
      description,
      reference,
      paymentMethod: paymentMethod || 'bank_transfer',
      customerId: customerId || null,
      supplierId: supplierId || null,
      status: 'completed'
    });

    await transaction.save();

    // تحديث رصيد المستلم حسب نوعه
    if (recipientType === 'customer') {
      // عند استلام أموال من العميل: نخصم من رصيده (يعتبر دفع لك)
      recipient.Balance -= amount;
    } else {
      // عند استلام أموال من المورد: نزيد رصيده (يعتبر سحب منه)
      recipient.Balance += amount;
    }
    
    await recipient.save();

    // تحديث رصيد الحساب البنكي (الإضافة)
    account.balance += amount;
    await account.save();

    console.log(`Receive money transaction from ${recipientType} (${recipientModel}) completed successfully`);
    return transaction;
  } catch (error) {
    console.error('Error processing receive money:', error.message);
    throw error;
  }
}

  // Receive money (deposit)
// async receiveMoney(transactionData) {
//   try {
//     console.log('Processing receive money transaction');
    
//     const { accountId, customerId, amount, description, paymentMethod, reference } = transactionData;

//     // التحقق من وجود الحساب البنكي
//     const account = await BankAccount.findById(accountId);
//     if (!account) {
//       throw new Error('Bank account not found');
//     }

//     // التحقق من وجود العميل
//     const customer = await Client.findById(customerId);
//     if (!customer) {
//       throw new Error('Customer not found');
//     }

//     // إنشاء المعاملة
//     const transaction = new BankTransaction({
//       accountId,
//       transactionType: 'deposit',
//       amount,
//       description,
//       reference,
//       paymentMethod: paymentMethod || 'bank_transfer',
//       customerId,
//       status: 'completed'
//     });

//     await transaction.save();

//     // تحديث رصيد العميل (زيادة الرصيد)
//     await this.updateCustomerBalance(customerId, 0, amount);

//     console.log('Receive money transaction completed successfully');
//     return transaction;
//   } catch (error) {
//     console.error('Error processing receive money:', error.message);
//     throw error;
//   }
// }

  // ========== BALANCES ==========

  // Get all customer balances
  async getCustomerBalances() {
    try {
      console.log('Fetching customer balances');
      const balances = await CustomerBalance.find({}).sort({ customerName: 1 });
      console.log(`Found ${balances.length} customer balances`);
      return balances;
    } catch (error) {
      console.error('Error fetching customer balances:', error.message);
      throw error;
    }
  }

  // Get all supplier balances
  async getSupplierBalances() {
    try {
      console.log('Fetching supplier balances');
      const balances = await SupplierBalance.find({}).sort({ supplierName: 1 });
      console.log(`Found ${balances.length} supplier balances`);
      return balances;
    } catch (error) {
      console.error('Error fetching supplier balances:', error.message);
      throw error;
    }
  }

  // Update customer balance
async updateCustomerBalance(customerId, outstandingChange = 0, paymentAmount = 0) {
  try {
    console.log('Updating customer balance:', customerId);

    const customer = await Client.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // تحديث رصيد العميل في نموذج Client
    customer.Balance += paymentAmount - outstandingChange;
    await customer.save();

    let balance = await CustomerBalance.findOne({ customerId });
    
    if (!balance) {
      balance = new CustomerBalance({
        customerId,
        customerName: customer.companyName,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0
      });
    }

    balance.outstandingBalance += outstandingChange;
    balance.totalPaid += paymentAmount;

    if (paymentAmount > 0) {
      balance.lastPaymentDate = new Date();
      balance.lastPaymentAmount = paymentAmount;
    }

    balance.lastUpdated = new Date();
    await balance.save();

    console.log('Customer balance updated successfully');
    return balance;
  } catch (error) {
    console.error('Error updating customer balance:', error.message);
    throw error;
  }
}
  // Update supplier balance
async updateSupplierBalance(supplierId, outstandingChange = 0, paymentAmount = 0) {
  try {
    console.log('Updating supplier balance:', supplierId);

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    let balance = await SupplierBalance.findOne({ supplierId });
    
    if (!balance) {
      balance = new SupplierBalance({
        supplierId,
        supplierName: supplier.supplierName,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0
      });
    }

    balance.outstandingBalance += outstandingChange;
    balance.totalPaid += paymentAmount;

    if (paymentAmount > 0) {
      balance.lastPaymentDate = new Date();
      balance.lastPaymentAmount = paymentAmount;
    }

    balance.lastUpdated = new Date();
    await balance.save();

    console.log('Supplier balance updated successfully');
    return balance;
  } catch (error) {
    console.error('Error updating supplier balance:', error.message);
    throw error;
  }
}
  // Initialize/sync customer balances from existing data
  async syncCustomerBalances() {
    try {
      console.log('Syncing customer balances');
      
      const customers = await Client.find({});
      
      for (const customer of customers) {
        // Get customer transactions
        const deposits = await BankTransaction.find({ 
          customerId: customer._id,
          transactionType: 'deposit'
        });

        const totalPaid = deposits.reduce((sum, tx) => sum + tx.amount, 0);
        const lastPayment = deposits.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))[0];

        // Update or create balance record
        await CustomerBalance.findOneAndUpdate(
          { customerId: customer._id },
          {
            customerName: customer.companyName,
            totalPaid,
            lastPaymentDate: lastPayment?.transactionDate,
            lastPaymentAmount: lastPayment?.amount,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log('Customer balances synced successfully');
    } catch (error) {
      console.error('Error syncing customer balances:', error.message);
      throw error;
    }
  }

  // Initialize/sync supplier balances from existing data
  async syncSupplierBalances() {
    try {
      console.log('Syncing supplier balances');
      
      const suppliers = await Supplier.find({});
      
      for (const supplier of suppliers) {
        // Get supplier transactions
        const withdrawals = await BankTransaction.find({ 
          supplierId: supplier._id,
          transactionType: 'withdrawal'
        });

        const totalPaid = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
        const lastPayment = withdrawals.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))[0];

        // Update or create balance record
        await SupplierBalance.findOneAndUpdate(
          { supplierId: supplier._id },
          {
            supplierName: supplier.supplierName,
            totalPaid,
            lastPaymentDate: lastPayment?.transactionDate,
            lastPaymentAmount: lastPayment?.amount,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log('Supplier balances synced successfully');
    } catch (error) {
      console.error('Error syncing supplier balances:', error.message);
      throw error;
    }
  }

  async  getSupplierTransactions(supplierId) {
  try {
    const transactions = await BankTransaction.find({ supplierId })
      .populate('accountId', 'accountName bankName accountNumber') // معلومات الحساب
      .populate('supplierId', 'supplierName') // معلومات المورد
      .sort({ transactionDate: -1 }); // الأحدث أولاً
    
    return transactions;
  } catch (err) {
    throw new Error('Error fetching supplier transactions: ' + err.message);
  }
}

  


}


// GET /api/banking/suppliers/:id/transactions


module.exports = new BankingService();
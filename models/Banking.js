const mongoose = require('mongoose');

// Bank Account Schema
const bankAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  routingNumber: {
    type: String,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'business', 'money_market'],
    default: 'checking'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Bank Transaction Schema
const bankTransactionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  balance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'wire', 'ach', 'check', 'cash'],
    default: 'bank_transfer'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  recipientType: {
    type: String,
    enum: ['customer', 'supplier', 'internal'],
    required: function() {
      return this.transactionType === 'transfer';
    }
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.transactionType === 'transfer';
    }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }
}, {
  timestamps: true
});

// Customer Balance Schema (aggregated view)
const customerBalanceSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  totalInvoiced: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Supplier Balance Schema (aggregated view)
const supplierBalanceSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    unique: true
  },
  supplierName: {
    type: String,
    required: true
  },
  totalInvoiced: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
bankAccountSchema.index({ accountNumber: 1 });
bankAccountSchema.index({ isActive: 1 });

bankTransactionSchema.index({ accountId: 1, transactionDate: -1 });
bankTransactionSchema.index({ customerId: 1 });
bankTransactionSchema.index({ supplierId: 1 });
bankTransactionSchema.index({ status: 1 });

customerBalanceSchema.index({ customerId: 1 });
supplierBalanceSchema.index({ supplierId: 1 });

// Virtual for account display name
bankAccountSchema.virtual('displayName').get(function() {
  return `${this.accountName} (${this.bankName})`;
});

// Pre-save middleware to update balance after transaction
bankTransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const BankAccount = mongoose.model('BankAccount');
    const account = await BankAccount.findById(this.accountId);
    
    if (!account) {
      throw new Error('Bank account not found');
    }

    // Calculate new balance
    let newBalance = account.balance;
    if (this.transactionType === 'deposit') {
      newBalance += this.amount;
    } else if (this.transactionType === 'withdrawal' || this.transactionType === 'transfer') {
      newBalance -= this.amount;
    }

    // Check for sufficient funds
    if (newBalance < 0) {
      throw new Error('Insufficient funds');
    }

    this.balance = newBalance;
    
    // Update account balance
    await BankAccount.findByIdAndUpdate(this.accountId, { balance: newBalance });
  }
  next();
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);
const CustomerBalance = mongoose.model('CustomerBalance', customerBalanceSchema);
const SupplierBalance = mongoose.model('SupplierBalance', supplierBalanceSchema);

module.exports = {
  BankAccount,
  BankTransaction,
  CustomerBalance,
  SupplierBalance
};
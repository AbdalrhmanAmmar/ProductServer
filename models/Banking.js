const mongoose = require('mongoose');

// Bank Account Schema
const bankAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    unique: true,
    trim: true,
 
  },
    isActive: {
    type: Boolean,
    default: true
  },
  routingNumber: {
    type: String,
    trim: true,

  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'business', 'money_market'],
    default: 'checking'
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
    get: v => Math.round(v * 100) / 100, // Ensure 2 decimal places
    set: v => Math.round(v * 100) / 100
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'JPY'] // Add more as needed
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Bank Transaction Schema
const bankTransactionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: [true, 'Account ID is required']
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Minimum transaction amount is 0.01'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  balance: {
    type: Number,
    required: [false, 'Balance is required'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'wire', 'ach', 'check', 'cash', 'card'],
    default: 'bank_transfer'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'completed'
  },
  recipientType: {
    type: String,
    enum: ['customer', 'supplier', 'internal', 'external'],
    required: function() {
      return this.transactionType === 'transfer';
    }
  },

  recipientAccount: {
    type: String,
    required: function() {
      return this.transactionType === 'transfer' && this.recipientType === 'external';
    },
    validate: {
      validator: function(v) {
        return /^\d{8,20}$/.test(v);
      },
      message: props => `${props.value} is not a valid account number!`
    }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },

}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Enhanced Customer Balance Schema
const customerBalanceSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Customer ID is required'],
    unique: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required']
  },
  totalInvoiced: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },


  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_60', 'due_on_receipt', 'prepaid'],
    default: 'net_30'
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Enhanced Supplier Balance Schema
const supplierBalanceSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required'],
    unique: true
  },
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required']
  },
  totalInvoiced: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_60', 'due_on_receipt', 'prepaid'],
    default: 'net_30'
  },

}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes for better performance
bankAccountSchema.index({ accountNumber: 1 }, { unique: true });
bankAccountSchema.index({ isActive: 1 });
bankAccountSchema.index({ balance: 1 });
bankAccountSchema.index({ accountType: 1 });

bankTransactionSchema.index({ accountId: 1, transactionDate: -1 });
bankTransactionSchema.index({ customerId: 1 });
bankTransactionSchema.index({ supplierId: 1 });
bankTransactionSchema.index({ status: 1 });
bankTransactionSchema.index({ transactionType: 1 });
bankTransactionSchema.index({ reference: 1 }, { sparse: true });
bankTransactionSchema.index({ 'recipientAccount': 1 }, { sparse: true });

customerBalanceSchema.index({ customerId: 1 }, { unique: true });
customerBalanceSchema.index({ outstandingBalance: 1 });
customerBalanceSchema.index({ customerName: 'text' });

supplierBalanceSchema.index({ supplierId: 1 }, { unique: true });
supplierBalanceSchema.index({ outstandingBalance: 1 });
supplierBalanceSchema.index({ supplierName: 'text' });

// Virtuals and Methods
bankAccountSchema.virtual('displayName').get(function() {
  return `${this.accountName} (${this.bankName} - ${this.accountNumber.slice(-4)})`;
});

bankAccountSchema.virtual('availableBalance').get(function() {
  return this.balance + (this.allowOverdraft ? this.overdraftLimit : 0);
});

bankAccountSchema.methods.canWithdraw = function(amount) {
  return this.balance + (this.allowOverdraft ? this.overdraftLimit : 0) >= amount;
};

// Transaction Middleware with Session Handling
bankTransactionSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed') {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const BankAccount = mongoose.model('BankAccount');
      const account = await BankAccount.findById(this.accountId).session(session);
      
      if (!account) {
        throw new Error('Bank account not found');
      }

      // Calculate new balance
      let newBalance = account.balance;
      if (this.transactionType === 'deposit') {
        newBalance += this.amount;
      } else if (this.transactionType === 'withdrawal' || this.transactionType === 'transfer') {
        if (!account.canWithdraw(this.amount)) {
          throw new Error('Insufficient funds');
        }
        newBalance -= this.amount;
      }

      // Update account balance
      await BankAccount.findByIdAndUpdate(
        this.accountId,
        { balance: newBalance },
        { session, new: true }
      );

      // Set the calculated balance on the transaction
      this.balance = newBalance;
      
      await session.commitTransaction();
      next();
    } catch (error) {
      await session.abortTransaction();
      this.status = 'failed';
      this.description = `${this.description} - FAILED: ${error.message}`;
      next();
    } finally {
      session.endSession();
    }
  } else {
    next();
  }
});

// Post-save hook to update customer/supplier balances
bankTransactionSchema.post('save', async function(doc, next) {
  if (doc.status === 'completed') {
    try {
      const CustomerBalance = mongoose.model('CustomerBalance');
      const SupplierBalance = mongoose.model('SupplierBalance');
      
      if (doc.customerId) {
        await CustomerBalance.updateOne(
          { customerId: doc.customerId },
          {
            $inc: { 
              totalPaid: doc.transactionType === 'deposit' ? doc.amount : 0,
              outstandingBalance: doc.transactionType === 'withdrawal' ? -doc.amount : 0
            },
            $set: {
              lastPaymentDate: doc.transactionDate,
              lastPaymentAmount: doc.amount,
              lastUpdated: new Date()
            }
          }
        );
      }
      
      if (doc.supplierId) {
        await SupplierBalance.updateOne(
          { supplierId: doc.supplierId },
          {
            $inc: { 
              totalPaid: doc.amount,
              outstandingBalance: -doc.amount
            },
            $set: {
              lastPaymentDate: doc.transactionDate,
              lastPaymentAmount: doc.amount,
              lastUpdated: new Date()
            }
          }
        );
      }
    } catch (error) {
      console.error('Error updating customer/supplier balance:', error);
    }
  }
  next();
});

// Models
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
const mongoose = require('mongoose');

const transactionEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: true });

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
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
  entries: [transactionEntrySchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'posted', 'cancelled'],
    default: 'posted'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to generate transaction number and validate entries
transactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate transaction number (TXN-YYYYMMDD-XXXX)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Transaction').countDocuments();
    this.transactionNumber = `TXN-${datePart}-${(count + 1).toString().padStart(4, '0')}`;
    
    // Calculate total amount (sum of all debits)
    this.totalAmount = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
  }

  // Validate that debits equal credits
  const totalDebits = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = this.entries.reduce((sum, entry) => sum + entry.credit, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('Total debits must equal total credits');
  }

  // Validate each entry has either debit or credit (not both or neither)
  const hasInvalidEntries = this.entries.some(entry => 
    (entry.debit > 0 && entry.credit > 0) || (entry.debit === 0 && entry.credit === 0)
  );

  if (hasInvalidEntries) {
    throw new Error('Each entry must have either a debit or credit amount (not both or neither)');
  }

  next();
});

// Post-save hook to update account balances
transactionSchema.post('save', async function(doc) {
  if (doc.status === 'posted') {
    const Account = mongoose.model('Account');
    
    for (const entry of doc.entries) {
      const account = await Account.findById(entry.accountId);
      if (!account) continue;

      if (entry.debit > 0) {
        // For assets and expenses, debit increases balance
        // For liabilities, equity, and revenue, debit decreases balance
        const isDebitIncrease = ['asset', 'expense'].includes(account.accountType);
        account.balance += isDebitIncrease ? entry.debit : -entry.debit;
      } else if (entry.credit > 0) {
        // For assets and expenses, credit decreases balance
        // For liabilities, equity, and revenue, credit increases balance
        const isCreditIncrease = ['liability', 'equity', 'revenue'].includes(account.accountType);
        account.balance += isCreditIncrease ? entry.credit : -entry.credit;
      }

      await account.save();
    }
  }
});

// Post-remove hook to reverse account balances if transaction was posted
transactionSchema.post('remove', async function(doc) {
  if (doc.status === 'posted') {
    const Account = mongoose.model('Account');
    
    for (const entry of doc.entries) {
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
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
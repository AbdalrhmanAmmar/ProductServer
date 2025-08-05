require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();


// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const seedRoutes = require('./routes/seedRoutes');
const clientRoutes = require('./routes/clientRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoices');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const connectDB = require('./config/database.js');
const shippingRoutes = require('./routes/shippingRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const ShippingCompanyRoutes = require('./routes/ShippingCompanyRoutes');



const app = express();
const PORT = process.env.PORT || 4444;

app.use(cors({
  origin: ['https://purchase-beta.vercel.app' , 'http://localhost:5173'], // أو رابط الفرونت إند
  credentials: true
}));





// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/accounts', accountingRoutes);
app.use('/api/transactions',transactionRoutes );
app.use('/api/shippingCompany',ShippingCompanyRoutes );


app.post('/logs', (req, res) => {
  console.log('Log received:', req.body);
  res.status(200).json({ message: 'Log received' });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler



connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1); // Exit the process if DB connection fails
});



module.exports = app;
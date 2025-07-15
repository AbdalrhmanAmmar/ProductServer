const User = require('../models/User');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const { hashPassword } = require('../utils/password');

class SeedService {
  static async seedAdmin() {
    try {
      console.log('Starting admin user seeding...');
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: 'admin@brokerpro.com' });
      if (existingAdmin) {
        console.log('Admin user already exists');
        return { message: 'Admin user already exists', user: existingAdmin };
      }

      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const adminUser = new User({
        email: 'admin@brokerpro.com',
        password: hashedPassword,
        role: 'admin'
      });

      const savedUser = await adminUser.save();
      console.log('Admin user created successfully');
      
      return { message: 'Admin user created successfully', user: savedUser };
    } catch (error) {
      console.error('Error seeding admin user:', error);
      throw error;
    }
  }

  static async seedClients() {
    try {
      console.log('Starting clients seeding...');
      
      const clientsData = [
        {
          companyName: 'Acme Corporation',
          contactPerson: 'John Smith',
          email: 'john@acme.com',
          phone: '+1-555-0101',
          country: 'US'
        },
        {
          companyName: 'Global Tech Solutions',
          contactPerson: 'Sarah Johnson',
          email: 'sarah@globaltech.com',
          phone: '+1-555-0102',
          country: 'US'
        },
        {
          companyName: 'Manufacturing Plus',
          contactPerson: 'Mike Chen',
          email: 'mike@mfgplus.com',
          phone: '+1-555-0103',
          country: 'CA'
        },
        {
          companyName: 'European Imports Ltd',
          contactPerson: 'Anna Mueller',
          email: 'anna@euroimports.com',
          phone: '+49-30-12345678',
          country: 'DE'
        },
        {
          companyName: 'Asia Pacific Trading',
          contactPerson: 'Tanaka Hiroshi',
          email: 'tanaka@aptrading.com',
          phone: '+81-3-12345678',
          country: 'JP'
        }
      ];

      const existingClients = await Client.find({});
      if (existingClients.length > 0) {
        console.log('Clients already exist');
        return { message: 'Clients already exist', count: existingClients.length };
      }

      const clients = await Client.insertMany(clientsData);
      console.log(`${clients.length} clients created successfully`);
      
      return { message: `${clients.length} clients created successfully`, clients };
    } catch (error) {
      console.error('Error seeding clients:', error);
      throw error;
    }
  }

  static async seedSuppliers() {
    try {
      console.log('Starting suppliers seeding...');
      
      const suppliersData = [
        { name: 'China Manufacturing Co.' },
        { name: 'European Steel Works' },
        { name: 'Asia Electronics Ltd.' },
        { name: 'Global Components Inc.' },
        { name: 'Industrial Supplies Pro' }
      ];

      const existingSuppliers = await Supplier.find({});
      if (existingSuppliers.length > 0) {
        console.log('Suppliers already exist');
        return { message: 'Suppliers already exist', count: existingSuppliers.length };
      }

      const suppliers = await Supplier.insertMany(suppliersData);
      console.log(`${suppliers.length} suppliers created successfully`);
      
      return { message: `${suppliers.length} suppliers created successfully`, suppliers };
    } catch (error) {
      console.error('Error seeding suppliers:', error);
      throw error;
    }
  }

  static async seedOrders() {
    try {
      console.log('Starting orders seeding...');
      
      // Get existing clients
      const clients = await Client.find({}).limit(5);
      if (clients.length === 0) {
        throw new Error('No clients found. Please seed clients first.');
      }

      const existingOrders = await Order.find({});
      if (existingOrders.length > 0) {
        console.log('Orders already exist');
        return { message: 'Orders already exist', count: existingOrders.length };
      }

      const ordersData = [
        {
          clientId: clients[0]._id,
          clientName: clients[0].companyName,
          projectName: 'Industrial Equipment Import',
          workflowType: 'fast-track',
          status: 'in-progress',
          expectedDelivery: new Date('2024-02-15'),
          currency: 'USD',
          priority: 'high',
          commissionRate: 5.5,
          requirements: 'High-quality industrial machinery for manufacturing plant',
          specialInstructions: 'Urgent delivery required',
          hasPurchaseOrders: true,
          hasInvoices: true,
          hasShipping: false,
          hasQuotations: false
        },
        {
          clientId: clients[1]._id,
          clientName: clients[1].companyName,
          projectName: 'Electronics Components',
          workflowType: 'standard',
          status: 'pending',
          expectedDelivery: new Date('2024-03-01'),
          currency: 'USD',
          priority: 'normal',
          commissionRate: 4.0,
          requirements: 'Various electronic components for assembly line',
          hasPurchaseOrders: false,
          hasInvoices: false,
          hasShipping: false,
          hasQuotations: true
        },
        {
          clientId: clients[2]._id,
          clientName: clients[2].companyName,
          projectName: 'Raw Materials Supply',
          workflowType: 'fast-track',
          status: 'completed',
          expectedDelivery: new Date('2024-01-20'),
          currency: 'USD',
          priority: 'urgent',
          commissionRate: 6.0,
          requirements: 'Steel and aluminum raw materials',
          hasPurchaseOrders: true,
          hasInvoices: true,
          hasShipping: true,
          hasQuotations: false
        },
        {
          clientId: clients[3]._id,
          clientName: clients[3].companyName,
          projectName: 'Automotive Parts Import',
          workflowType: 'standard',
          status: 'in-progress',
          expectedDelivery: new Date('2024-02-28'),
          currency: 'EUR',
          priority: 'normal',
          commissionRate: 4.5,
          requirements: 'Automotive spare parts and components',
          specialInstructions: 'Quality certification required',
          hasPurchaseOrders: true,
          hasInvoices: false,
          hasShipping: false,
          hasQuotations: true
        },
        {
          clientId: clients[4]._id,
          clientName: clients[4].companyName,
          projectName: 'Consumer Electronics',
          workflowType: 'fast-track',
          status: 'pending',
          expectedDelivery: new Date('2024-03-15'),
          currency: 'USD',
          priority: 'low',
          commissionRate: 3.5,
          requirements: 'Consumer electronics for retail distribution',
          hasPurchaseOrders: false,
          hasInvoices: false,
          hasShipping: false,
          hasQuotations: false
        }
      ];

      const orders = await Order.insertMany(ordersData);
      console.log(`${orders.length} orders created successfully`);
      
      return { message: `${orders.length} orders created successfully`, orders };
    } catch (error) {
      console.error('Error seeding orders:', error);
      throw error;
    }
  }

  static async seedAll() {
    try {
      console.log('Starting complete database seeding...');
      
      const results = {};
      
      // Seed in order of dependencies
      results.admin = await this.seedAdmin();
      results.clients = await this.seedClients();
      results.suppliers = await this.seedSuppliers();
      results.orders = await this.seedOrders();
      
      console.log('All seeding completed successfully');
      return { message: 'All data seeded successfully', results };
    } catch (error) {
      console.error('Error in complete seeding:', error);
      throw error;
    }
  }
}

module.exports = SeedService;
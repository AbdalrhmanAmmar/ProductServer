const Client = require('../models/Client');

class ClientService {
  // Create a new client
  async createClient(clientData) {
    try {
      console.log('Creating new client:', clientData.companyName);
      
      // Check if client with same email already exists
      const existingClient = await Client.findOne({ email: clientData.email });
      if (existingClient) {
        throw new Error('Client with this email already exists');
      }

      const client = new Client(clientData);
      await client.save();
      
      console.log('Client created successfully:', client._id);
      return client;
    } catch (error) {
      console.error('Error creating client:', error.message);
      throw error;
    }
  }

  // Get all clients
  async getAllClients() {
    try {
      console.log('Fetching all clients');
      const clients = await Client.find({}).sort({ createdAt: -1 });
      console.log(`Found ${clients.length} clients`);
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      throw error;
    }
  }

  // Get client by ID
  async getClientById(clientId) {
    try {
      console.log('Fetching client by ID:', clientId);
      const client = await Client.findById(clientId);
      
      if (!client) {
        throw new Error('Client not found');
      }
      
      console.log('Client found:', client.companyName);
      return client;
    } catch (error) {
      console.error('Error fetching client:', error.message);
      throw error;
    }
  }

  // Update client
  async updateClient(clientId, updateData) {
    try {
      console.log('Updating client:', clientId);
      
      // Check if email is being updated and if it conflicts with another client
      if (updateData.email) {
        const existingClient = await Client.findOne({ 
          email: updateData.email, 
          _id: { $ne: clientId } 
        });
        if (existingClient) {
          throw new Error('Client with this email already exists');
        }
      }

      const client = await Client.findByIdAndUpdate(
        clientId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!client) {
        throw new Error('Client not found');
      }

      console.log('Client updated successfully:', client.companyName);
      return client;
    } catch (error) {
      console.error('Error updating client:', error.message);
      throw error;
    }
  }

  // Delete client
  async deleteClient(clientId) {
    try {
      console.log('Deleting client:', clientId);
      
      const client = await Client.findByIdAndDelete(clientId);
      
      if (!client) {
        throw new Error('Client not found');
      }

      console.log('Client deleted successfully:', client.companyName);
      return client;
    } catch (error) {
      console.error('Error deleting client:', error.message);
      throw error;
    }
  }

  // Get client statement (mock implementation for now)
  async getClientStatement(clientId) {
    try {
      console.log('Fetching client statement for:', clientId);
      
      const client = await this.getClientById(clientId);
      
      // For now, return mock statement data
      // In future tasks, this will be replaced with real transaction data
      const statement = {
        client: client,
        totalInvoiced: 25000,
        totalPaid: 18000,
        outstandingBalance: 7000,
        transactions: [
          {
            _id: '1',
            type: 'invoice',
            description: 'Sales Invoice #INV-001',
            amount: 15000,
            date: new Date('2024-01-15T10:00:00Z'),
            orderId: '1',
            invoiceId: 'INV-001',
            reference: 'ORDER-001',
            status: 'completed'
          },
          {
            _id: '2',
            type: 'payment',
            description: 'Payment received via bank transfer',
            amount: -10000,
            date: new Date('2024-01-20T14:30:00Z'),
            reference: 'PAY-001',
            status: 'completed'
          }
        ],
        orders: [
          {
            _id: '1',
            projectName: 'Industrial Equipment Import',
            status: 'completed',
            totalAmount: 15000,
            commissionRate: 5.5,
            expectedDelivery: new Date('2024-02-15T00:00:00Z'),
            createdAt: new Date('2024-01-10T10:00:00Z')
          }
        ],
        shipments: [
          {
            _id: '1',
            orderId: '1',
            trackingNumber: 'DHL123456789',
            shippingCompany: 'DHL Express',
            status: 'delivered',
            expectedDelivery: new Date('2024-02-10T00:00:00Z'),
            totalCost: 1200,
            createdAt: new Date('2024-01-25T14:20:00Z')
          }
        ]
      };

      console.log('Client statement generated for:', client.companyName);
      return statement;
    } catch (error) {
      console.error('Error fetching client statement:', error.message);
      throw error;
    }
  }
}

module.exports = new ClientService();
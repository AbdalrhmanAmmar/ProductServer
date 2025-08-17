const Supplier = require('../models/Supplier');

class SupplierService {
  static async getAllSuppliers() {
    try {
      console.log('Fetching all suppliers from database');
      const suppliers = await Supplier.find().sort({ createdAt: -1 });
      console.log(`Found ${suppliers.length} suppliers`);
      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
  }

static async getSupplierById(supplierId) {
  try {
    console.log(`Fetching supplier with ID: ${supplierId}`);
    const supplier = await Supplier.findById(supplierId)
      .populate('purchaseOrders', 'orderId totalAmount status deliveryDate');

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    console.log(`Found supplier: ${supplier.supplierName}`);
    return supplier;
  } catch (error) {
    console.error('Error fetching supplier:', error);
    if (error.message === 'Supplier not found') {
      throw error;
    }
    throw new Error(`Failed to fetch supplier: ${error.message}`);
  }
}

static async getSupplierPurchases(supplierId) {
  try {
    const supplier = await Supplier.findById(supplierId)
      .populate({
        path: 'purchaseOrders',
        populate: [
          { path: 'orderId', select: 'projectName clientName' },
          { path: 'items' },
          { path: 'payments' }
        ]
      });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier.purchaseOrders;
  } catch (error) {
    throw new Error(`Failed to get supplier purchases: ${error.message}`);
  }
}


  static async createSupplier(supplierData) {
    try {
      console.log('Creating new supplier:', supplierData.supplierName);
      
      // Check if supplier with same name already exists
      const existingSupplier = await Supplier.findOne({ 
        supplierName: { $regex: new RegExp(`^${supplierData.supplierName}$`, 'i') }
      });
      
      if (existingSupplier) {
        throw new Error('Supplier with this name already exists');
      }

      const supplier = new Supplier(supplierData);
      await supplier.save();
      console.log(`Supplier created successfully with ID: ${supplier._id}`);
      return supplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      if (error.message === 'Supplier with this name already exists') {
        throw error;
      }
      throw new Error(`Failed to create supplier: ${error.message}`);
    }
  }

  static async updateSupplier(supplierId, updateData) {
    try {
      console.log(`Updating supplier with ID: ${supplierId}`);
      
      // Check if supplier exists
      const existingSupplier = await Supplier.findById(supplierId);
      if (!existingSupplier) {
        throw new Error('Supplier not found');
      }

      // Check if another supplier with same name exists (excluding current supplier)
      if (updateData.supplierName) {
        const duplicateSupplier = await Supplier.findOne({ 
          supplierName: { $regex: new RegExp(`^${updateData.supplierName}$`, 'i') },
          _id: { $ne: supplierId }
        });
        
        if (duplicateSupplier) {
          throw new Error('Supplier with this name already exists');
        }
      }

      const supplier = await Supplier.findByIdAndUpdate(
        supplierId,
         purchaseOrderData.supplierId,
         
        { ...updateData, updatedAt: new Date(),
           $push: { purchaseOrders: savedPurchaseOrder._id }

         },
        { new: true, runValidators: true }
      );

      console.log(`Supplier updated successfully: ${supplier.supplierName}`);
      return supplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      if (error.message === 'Supplier not found' || error.message === 'Supplier with this name already exists') {
        throw error;
      }
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  }

  static async deleteSupplier(supplierId) {
    try {
      console.log(`Deleting supplier with ID: ${supplierId}`);
      
      const supplier = await Supplier.findById(supplierId);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      await Supplier.findByIdAndDelete(supplierId);
      console.log(`Supplier deleted successfully: ${supplier.supplierName}`);
      return { message: 'Supplier deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      if (error.message === 'Supplier not found') {
        throw error;
      }
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  }

  static async getSupplierStatement(supplierId) {
    try {
      console.log(`Generating statement for supplier ID: ${supplierId}`);
      
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Since we don't have purchase orders and invoices implemented yet,
      // we'll generate mock transaction data for the statement
      const mockTransactions = [
        {
          _id: '1',
          type: 'purchase_order',
          description: 'Purchase Order #PO-001',
          amount: 25000,
          date: new Date('2024-01-15T10:00:00Z'),
          orderId: '1',
          purchaseOrderId: 'PO-001',
          reference: 'ORDER-001',
          status: 'completed'
        },
        {
          _id: '2',
          type: 'payment',
          description: 'Payment sent via wire transfer',
          amount: -20000,
          date: new Date('2024-01-20T14:30:00Z'),
          reference: 'PAY-001',
          status: 'completed'
        },
        {
          _id: '3',
          type: 'purchase_order',
          description: 'Purchase Order #PO-002',
          amount: 20000,
          date: new Date('2024-01-25T09:15:00Z'),
          orderId: '2',
          purchaseOrderId: 'PO-002',
          reference: 'ORDER-002',
          status: 'pending'
        },
        {
          _id: '4',
          type: 'payment',
          description: 'Partial payment sent',
          amount: -18000,
          date: new Date('2024-01-28T16:45:00Z'),
          reference: 'PAY-002',
          status: 'completed'
        }
      ];

      const mockPurchaseOrders = [
        {
          _id: '1',
          orderId: '1',
          projectName: 'Industrial Equipment Import',
          status: 'received',
          totalAmount: 25000,
          paymentTerms: 'Net 30',
          deliveryDate: new Date('2024-02-15T00:00:00Z'),
          createdAt: new Date('2024-01-10T10:00:00Z')
        },
        {
          _id: '2',
          orderId: '2',
          projectName: 'Manufacturing Components',
          status: 'confirmed',
          totalAmount: 20000,
          paymentTerms: 'Net 45',
          deliveryDate: new Date('2024-03-01T00:00:00Z'),
          createdAt: new Date('2024-01-20T11:30:00Z')
        }
      ];

      const mockShipments = [
        {
          _id: '1',
          orderId: '1',
          purchaseOrderId: '1',
          trackingNumber: 'SF123456789',
          shippingCompany: 'SF Express',
          status: 'delivered',
          expectedDelivery: new Date('2024-02-10T00:00:00Z'),
          totalCost: 800,
          createdAt: new Date('2024-01-25T14:20:00Z')
        },
        {
          _id: '2',
          orderId: '2',
          purchaseOrderId: '2',
          trackingNumber: 'YT987654321',
          shippingCompany: 'YTO Express',
          status: 'in_transit',
          expectedDelivery: new Date('2024-02-28T00:00:00Z'),
          totalCost: 650,
          createdAt: new Date('2024-02-05T10:45:00Z')
        }
      ];

      const totalPurchased = 45000;
      const totalPaid = 38000;
      const outstandingBalance = totalPurchased - totalPaid;

      const statement = {
        supplier,
        totalPurchased,
        totalPaid,
        outstandingBalance,
        transactions: mockTransactions,
        purchaseOrders: mockPurchaseOrders,
        shipments: mockShipments
      };

      console.log(`Statement generated for supplier: ${supplier.supplierName}`);
      return statement;
    } catch (error) {
      console.error('Error generating supplier statement:', error);
      if (error.message === 'Supplier not found') {
        throw error;
      }
      throw new Error(`Failed to generate supplier statement: ${error.message}`);
    }
  }
  
}

module.exports = SupplierService;
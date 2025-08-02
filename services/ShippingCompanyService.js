const ShippingCompany = require('../models/ShippingCompany');

class ShippingCompanyService {
  static async createCompany(companyName) {
    try {
      const company = new ShippingCompany({ companyName });
      return await company.save();
    } catch (error) {
      throw error;
    }
  }

  static async getCompanies() {
    try {
      return await ShippingCompany.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ShippingCompanyService;
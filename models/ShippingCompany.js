const mongoose = require("mongoose");

const shippingCompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true
  }
}, { timestamps: true });

const ShippingCompany = mongoose.model("ShippingCompany", shippingCompanySchema);

module.exports = ShippingCompany;
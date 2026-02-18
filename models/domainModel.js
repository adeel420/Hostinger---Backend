const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema({
  extension: { type: String, required: true }, // .com, .pk, .net
  price: { type: Number, required: true },
  period: { type: String, default: "yearly" },
  isActive: { type: Boolean, default: true },
  whmcsTldId: { type: Number }, // WHMCS TLD ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Domain", domainSchema);

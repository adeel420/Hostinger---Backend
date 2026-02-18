const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderType: { type: String, enum: ["hosting", "domain"], required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "HostingPlan" },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain" },
  domainName: { type: String }, // For domain orders
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    city: String,
    country: String,
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["jazzcash", "easypaisa", "bank_transfer"], required: true },
  transactionId: { type: String, required: true },
  paymentProof: { type: String, required: true }, // Image URL/path
  status: { type: String, enum: ["pending", "approved", "rejected", "active"], default: "pending" },
  adminNote: String,
  whmcsOrderId: String, // WHMCS order ID after approval
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
});

module.exports = mongoose.model("Order", orderSchema);

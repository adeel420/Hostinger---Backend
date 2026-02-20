const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "HostingPlan", required: true },
  
  // Service Details
  serviceName: { type: String, required: true },
  status: { type: String, enum: ["pending", "active", "suspended", "expired"], default: "pending" },
  
  // Billing
  billingCycle: { type: String, enum: ["1month", "3months", "6months", "12months"], required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date },
  expiryDate: { type: Date },
  
  // cPanel Credentials (Admin fills after approval)
  cpanelUsername: { type: String },
  cpanelPassword: { type: String },
  cpanelUrl: { type: String },
  nameServer1: { type: String },
  nameServer2: { type: String },
  
  // Tracking
  createdAt: { type: Date, default: Date.now },
  activatedAt: { type: Date },
  
  // Notes
  adminNotes: { type: String },
});

module.exports = mongoose.model("Service", serviceSchema);

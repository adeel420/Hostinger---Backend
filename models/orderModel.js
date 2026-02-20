const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "HostingPlan", required: true },
  
  // Billing
  billingCycle: { type: String, enum: ["1month", "3months", "6months", "12months"], required: true },
  
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["jazzcash", "easypaisa", "bank_transfer", "crypto"], required: true },
  transactionId: { type: String, required: true },
  paymentProof: { type: String, required: true },
  paymentNotes: { type: String },
  
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminNote: String,
  
  // 6 hours verification window
  verificationDeadline: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
});

module.exports = mongoose.model("Order", orderSchema);

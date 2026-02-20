const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceType: { type: String, enum: ["new", "renewal"], default: "new" },
  
  amount: { type: Number, required: true },
  status: { type: String, enum: ["unpaid", "paid", "cancelled"], default: "unpaid" },
  
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  
  paymentMethod: { type: String },
  transactionId: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invoice", invoiceSchema);

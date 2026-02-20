const mongoose = require("mongoose");

const hostingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  // Pricing for different billing cycles
  pricing: {
    monthly: { type: Number, required: true },
    quarterly: { type: Number },
    semiannually: { type: Number },
    annually: { type: Number },
  },
  
  storage: { type: String, required: true },
  bandwidth: { type: String, required: true },
  websites: { type: String, required: true },
  emailAccounts: { type: String, required: true },
  features: [{ type: String }],
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HostingPlan", hostingPlanSchema);

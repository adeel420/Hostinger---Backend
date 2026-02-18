const mongoose = require("mongoose");

const hostingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hostingType: { type: String, enum: ["shared", "wordpress", "vps", "dedicated"], required: true },
  price: { type: Number, required: true },
  period: { type: String, default: "monthly" }, // monthly, yearly
  storage: { type: String, required: true },
  bandwidth: { type: String, required: true },
  websites: { type: String, required: true },
  emailAccounts: { type: String, required: true },
  cpuCores: { type: String }, // For VPS/Dedicated
  ram: { type: String }, // For VPS/Dedicated
  features: [{ type: String }],
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  whmcsProductId: { type: Number }, // WHMCS product ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HostingPlan", hostingPlanSchema);

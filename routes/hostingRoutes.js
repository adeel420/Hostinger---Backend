const express = require("express");
const router = express.Router();
const HostingPlan = require("../models/hostingPlanModel");
const { jwtAuthMiddleware } = require("../middleware/jwt");

// Get all active hosting plans (Public)
router.get("/plans", async (req, res) => {
  try {
    const { type } = req.query; // Filter by hosting type
    const filter = { isActive: true };
    if (type) filter.hostingType = type;
    
    const plans = await HostingPlan.find(filter).sort({ price: 1 });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create hosting plan (Admin only)
router.post("/plans", jwtAuthMiddleware, async (req, res) => {
  try {
    const { name, hostingType, price, period, storage, bandwidth, websites, emailAccounts, cpuCores, ram, features, isPopular, whmcsProductId } = req.body;
    
    const plan = new HostingPlan({
      name,
      hostingType,
      price,
      period,
      storage,
      bandwidth,
      websites,
      emailAccounts,
      cpuCores,
      ram,
      features,
      isPopular,
      whmcsProductId,
    });
    
    await plan.save();
    res.status(201).json({ message: "Plan created successfully", plan });
  } catch (err) {
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Update hosting plan (Admin only)
router.put("/plans/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const plan = await HostingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.status(200).json({ message: "Plan updated successfully", plan });
  } catch (err) {
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// Delete hosting plan (Admin only)
router.delete("/plans/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const plan = await HostingPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

module.exports = router;

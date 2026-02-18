const express = require("express");
const router = express.Router();
const Domain = require("../models/domainModel");
const { jwtAuthMiddleware } = require("../middleware/jwt");

// Get all active domains (Public) - Updated route
router.get("/list", async (req, res) => {
  try {
    const domains = await Domain.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json(domains);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// Search domain availability (Public)
router.post("/search", async (req, res) => {
  try {
    const { domainName } = req.body;
    const domains = await Domain.find({ isActive: true });
    
    // Simulate domain search results
    const results = domains.map(domain => ({
      domainName: `${domainName}${domain.extension}`,
      extension: domain.extension,
      price: domain.price,
      period: domain.period,
      available: Math.random() > 0.3, // Simulate availability
    }));
    
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to search domain" });
  }
});

// Get all active domains (Public) - Keep for backward compatibility
router.get("/domains", async (req, res) => {
  try {
    const domains = await Domain.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json(domains);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// Create domain (Admin only)
router.post("/domains", jwtAuthMiddleware, async (req, res) => {
  try {
    const { extension, price, period, whmcsTldId } = req.body;
    
    const domain = new Domain({ extension, price, period, whmcsTldId });
    await domain.save();
    
    res.status(201).json({ message: "Domain created successfully", domain });
  } catch (err) {
    res.status(500).json({ error: "Failed to create domain" });
  }
});

// Update domain (Admin only)
router.put("/domains/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!domain) return res.status(404).json({ error: "Domain not found" });
    res.status(200).json({ message: "Domain updated successfully", domain });
  } catch (err) {
    res.status(500).json({ error: "Failed to update domain" });
  }
});

// Delete domain (Admin only)
router.delete("/domains/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const domain = await Domain.findByIdAndDelete(req.params.id);
    if (!domain) return res.status(404).json({ error: "Domain not found" });
    res.status(200).json({ message: "Domain deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete domain" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Service = require("../models/serviceModel");
const Order = require("../models/orderModel");
const Invoice = require("../models/invoiceModel");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const transporter = require("../middleware/config");

// Get user services
router.get("/my-services", jwtAuthMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user.id })
      .populate("planId")
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Get service details
router.get("/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, userId: req.user.id })
      .populate("planId")
      .populate("orderId");
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

// Admin: Get all services
router.get("/admin/all", jwtAuthMiddleware, async (req, res) => {
  try {
    const services = await Service.find()
      .populate("userId", "name email")
      .populate("planId")
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Admin: Update service credentials
router.put("/admin/:id/credentials", jwtAuthMiddleware, async (req, res) => {
  try {
    const { cpanelUsername, cpanelPassword, cpanelUrl, nameServer1, nameServer2, domainName } = req.body;
    
    const service = await Service.findById(req.params.id).populate("userId").populate("planId");
    if (!service) return res.status(404).json({ error: "Service not found" });
    
    // Calculate expiry based on billing cycle
    const startDate = new Date();
    let expiryDate = new Date();
    
    switch(service.billingCycle) {
      case "1month": expiryDate.setMonth(expiryDate.getMonth() + 1); break;
      case "3months": expiryDate.setMonth(expiryDate.getMonth() + 3); break;
      case "6months": expiryDate.setMonth(expiryDate.getMonth() + 6); break;
      case "12months": expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
    }
    
    service.cpanelUsername = cpanelUsername;
    service.cpanelPassword = cpanelPassword;
    service.cpanelUrl = cpanelUrl;
    service.nameServer1 = nameServer1;
    service.nameServer2 = nameServer2;
    service.domainName = domainName;
    service.status = "active";
    service.startDate = startDate;
    service.expiryDate = expiryDate;
    service.activatedAt = new Date();
    
    await service.save();
    
    // Send credentials email to client
    await transporter.sendMail({
      from: '"HostPro Support" <adeelimran467@gmail.com>',
      to: service.userId.email,
      subject: "Your Hosting Service is Now Active - HostPro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">🎉 Your Hosting Service is Active!</h2>
            <p style="color: #4a5568; line-height: 1.6;">Hi ${service.userId.name},</p>
            <p style="color: #4a5568; line-height: 1.6;">Your hosting service has been activated successfully. Here are your login credentials:</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-bottom: 15px;">Service Details</h3>
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${service.planId.name}</p>
              <p style="margin: 8px 0;"><strong>Domain:</strong> ${domainName || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Start Date:</strong> ${startDate.toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
            </div>
            
            <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-bottom: 15px;">cPanel Login Credentials</h3>
              <p style="margin: 8px 0;"><strong>Username:</strong> ${cpanelUsername}</p>
              <p style="margin: 8px 0;"><strong>Password:</strong> ${cpanelPassword}</p>
              <p style="margin: 8px 0;"><strong>cPanel URL:</strong> <a href="${cpanelUrl}" style="color: #667eea;">${cpanelUrl}</a></p>
            </div>
            
            <div style="background: #e6fffa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-bottom: 15px;">Name Servers</h3>
              <p style="margin: 8px 0;"><strong>NS1:</strong> ${nameServer1}</p>
              <p style="margin: 8px 0;"><strong>NS2:</strong> ${nameServer2}</p>
              <p style="margin: 8px 0; color: #718096; font-size: 14px;">Point your domain to these name servers to connect it with your hosting.</p>
            </div>
            
            <a href="${cpanelUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">Login to cPanel</a>
            
            <p style="color: #4a5568; line-height: 1.6; margin-top: 20px;">If you have any questions, feel free to contact our support team.</p>
            <p style="color: #4a5568; line-height: 1.6;">Best regards,<br><strong>HostPro Support Team</strong></p>
          </div>
        </div>
      `
    });
    
    res.json({ message: "Service activated and credentials sent to client", service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Admin: Suspend service
router.put("/admin/:id/suspend", jwtAuthMiddleware, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );
    res.json({ message: "Service suspended", service });
  } catch (error) {
    res.status(500).json({ error: "Failed to suspend service" });
  }
});

// Admin: Delete service
router.delete("/admin/:id", jwtAuthMiddleware, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete service" });
  }
});

// Check and update expired services (cron job endpoint)
router.post("/check-expiry", async (req, res) => {
  try {
    const now = new Date();
    const expiredServices = await Service.updateMany(
      { expiryDate: { $lte: now }, status: "active" },
      { status: "expired" }
    );
    res.json({ message: "Expiry check completed", updated: expiredServices.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to check expiry" });
  }
});

module.exports = router;

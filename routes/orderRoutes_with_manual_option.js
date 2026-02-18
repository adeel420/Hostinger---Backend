const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { upload } = require("../config/cloudinary");

// Create order
router.post("/orders", jwtAuthMiddleware, upload.single("paymentProof"), async (req, res) => {
  try {
    const { orderType, planId, domainId, domainName, customerDetails, amount, paymentMethod, transactionId } = req.body;
    
    const order = new Order({
      userId: req.user.id,
      orderType,
      planId,
      domainId,
      domainName,
      customerDetails: JSON.parse(customerDetails),
      amount,
      paymentMethod,
      transactionId,
      paymentProof: req.file ? req.file.path : "",
    });
    
    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get user orders
router.get("/orders/my-orders", jwtAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("planId")
      .populate("domainId")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get all orders (Admin only)
router.get("/orders", jwtAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("planId")
      .populate("domainId")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Approve order (Admin only) - WITH WHMCS INTEGRATION
router.put("/orders/:id/approve", jwtAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId").populate("planId");
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    // Check if WHMCS is configured
    const whmcsEnabled = process.env.WHMCS_URL && process.env.WHMCS_IDENTIFIER && process.env.WHMCS_SECRET;
    
    if (whmcsEnabled) {
      // WHMCS Integration
      const { createWHMCSClient, createWHMCSHostingOrder, registerWHMCSDomain, acceptWHMCSOrder } = require("../config/whmcs");
      
      try {
        // Create client in WHMCS
        const clientResponse = await createWHMCSClient({
          firstName: order.customerDetails.firstName,
          lastName: order.customerDetails.lastName,
          email: order.userId.email,
          address: order.customerDetails.address,
          city: order.customerDetails.city,
          state: order.customerDetails.state,
          postcode: order.customerDetails.postcode,
          country: order.customerDetails.country,
          phone: order.customerDetails.phone,
        });
        
        let whmcsOrderId;
        
        if (order.orderType === "hosting") {
          // Create hosting order
          const orderResponse = await createWHMCSHostingOrder(
            clientResponse.clientid,
            order.planId.whmcsProductId,
            order.domainName
          );
          whmcsOrderId = orderResponse.orderid;
        } else if (order.orderType === "domain") {
          // Register domain
          const domainResponse = await registerWHMCSDomain(
            clientResponse.clientid,
            order.domainName.split(".")[0],
            "." + order.domainName.split(".").slice(1).join(".")
          );
          whmcsOrderId = domainResponse.orderid;
        }
        
        // Accept order (mark as paid)
        await acceptWHMCSOrder(whmcsOrderId);
        
        order.status = "active";
        order.whmcsOrderId = whmcsOrderId;
        order.approvedAt = new Date();
        await order.save();
        
        res.status(200).json({ message: "Order approved and provisioned in WHMCS", order });
      } catch (whmcsError) {
        console.error("WHMCS Error:", whmcsError);
        order.status = "approved";
        order.approvedAt = new Date();
        order.adminNote = `WHMCS Error: ${whmcsError.message}`;
        await order.save();
        res.status(200).json({ message: "Order approved but WHMCS provisioning failed", order, error: whmcsError.message });
      }
    } else {
      // Manual provisioning (No WHMCS)
      order.status = "approved";
      order.approvedAt = new Date();
      order.adminNote = "Manual provisioning required - WHMCS not configured";
      await order.save();
      
      res.status(200).json({ 
        message: "Order approved - Manual provisioning required", 
        order,
        note: "Please manually create hosting account and update order status to 'active'"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve order" });
  }
});

// Reject order (Admin only)
router.put("/orders/:id/reject", jwtAuthMiddleware, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    order.status = "rejected";
    order.adminNote = adminNote;
    await order.save();
    
    res.status(200).json({ message: "Order rejected", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject order" });
  }
});

// Manually activate order (Admin only) - For manual provisioning
router.put("/orders/:id/activate", jwtAuthMiddleware, async (req, res) => {
  try {
    const { cpanelUsername, cpanelPassword, serverIp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    order.status = "active";
    order.adminNote = `Manual activation - cPanel: ${cpanelUsername}`;
    order.activatedAt = new Date();
    await order.save();
    
    res.status(200).json({ message: "Order activated manually", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to activate order" });
  }
});

module.exports = router;

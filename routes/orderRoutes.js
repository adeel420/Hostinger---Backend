const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const Service = require("../models/serviceModel");
const Invoice = require("../models/invoiceModel");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { upload } = require("../config/cloudinary");
const transporter = require("../middleware/config");

// Create order with 6 hours verification window
router.post("/orders", jwtAuthMiddleware, upload.single("paymentProof"), async (req, res) => {
  try {
    const { planId, customerDetails, amount, paymentMethod, transactionId, billingCycle, paymentNotes } = req.body;
    
    // Set verification deadline to 6 hours from now
    const verificationDeadline = new Date(Date.now() + 6 * 60 * 60 * 1000);
    
    const parsedCustomerDetails = JSON.parse(customerDetails);
    
    const order = new Order({
      userId: req.user.id,
      planId,
      billingCycle,
      customerDetails: parsedCustomerDetails,
      amount,
      paymentMethod,
      transactionId,
      paymentNotes,
      paymentProof: req.file ? req.file.path : "",
      verificationDeadline
    });
    
    await order.save();
    
    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = new Invoice({
      userId: req.user.id,
      orderId: order._id,
      invoiceNumber,
      amount,
      dueDate: verificationDeadline,
      status: "unpaid"
    });
    await invoice.save();
    
    // Send email to customer
    await transporter.sendMail({
      from: '"WARU Hosting" <adeelimran467@gmail.com>',
      to: parsedCustomerDetails.email,
      subject: "Order Received - Payment Verification in Progress",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Order Received Successfully!</h2>
            <p style="color: #4a5568; line-height: 1.6;">Hi ${parsedCustomerDetails.name},</p>
            <p style="color: #4a5568; line-height: 1.6;">Thank you for your order! We have received your payment proof and our team will verify it within 6 hours.</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Order Details</h3>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> Rs ${amount}</p>
              <p style="margin: 5px 0;"><strong>Billing Cycle:</strong> ${billingCycle}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod.replace('_', ' ').toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              <p style="margin: 5px 0;"><strong>Verification Deadline:</strong> ${verificationDeadline.toLocaleString()}</p>
            </div>
            <div style="background: #fef5e7; padding: 15px; border-left: 4px solid #f39c12; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⏰ What's Next?</strong></p>
              <p style="margin: 10px 0 0 0; color: #856404;">Our admin team will verify your payment within 6 hours. Once approved, you'll receive your cPanel credentials via email.</p>
            </div>
            <p style="color: #4a5568; line-height: 1.6;">Best regards,<br><strong>WARU Hosting Team</strong></p>
          </div>
        </div>
      `
    });
    
    // Send email to admin
    await transporter.sendMail({
      from: '"WARU Hosting System" <adeelimran467@gmail.com>',
      to: "adeelimran467@gmail.com",
      subject: `New Order #${order._id.toString().slice(-8)} - Payment Verification Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">🔔 New Order Received - Action Required</h2>
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Payment verification required within 6 hours</strong></p>
            </div>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #667eea; margin-top: 0;">Customer Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${parsedCustomerDetails.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${parsedCustomerDetails.email}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${parsedCustomerDetails.phone}</p>
            </div>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #667eea; margin-top: 0;">Order Details</h3>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> Rs ${amount}</p>
              <p style="margin: 5px 0;"><strong>Billing Cycle:</strong> ${billingCycle}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod.replace('_', ' ').toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              <p style="margin: 5px 0;"><strong>Payment Notes:</strong> ${paymentNotes || 'N/A'}</p>
            </div>
            <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; border-radius: 4px;">
              <p style="margin: 0; color: #2e7d32;"><strong>📸 Payment Proof:</strong> Uploaded successfully</p>
              <p style="margin: 10px 0 0 0; color: #2e7d32; font-size: 12px;">View in admin dashboard</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #495057;"><strong>Login to admin dashboard to approve this order</strong></p>
            </div>
          </div>
        </div>
      `
    });
    
    res.status(201).json({ 
      message: "Order submitted successfully. Admin will verify within 6 hours.", 
      order, 
      invoice,
      verificationDeadline 
    });
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
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get all orders (Admin only)
router.get("/orders", jwtAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("planId")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Approve order and create service (Admin only)
router.put("/orders/:id/approve", jwtAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId").populate("planId");
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    order.status = "approved";
    order.approvedAt = new Date();
    await order.save();
    
    // Create service for manual provisioning
    const service = new Service({
      userId: order.userId._id,
      orderId: order._id,
      planId: order.planId._id,
      serviceName: order.planId.name,
      billingCycle: order.billingCycle,
      amount: order.amount,
      status: "pending"
    });
    await service.save();
    
    // Update invoice
    await Invoice.findOneAndUpdate(
      { orderId: order._id },
      { 
        status: "paid", 
        paidDate: new Date(), 
        paymentMethod: order.paymentMethod, 
        transactionId: order.transactionId,
        serviceId: service._id 
      }
    );
    
    // Send approval email to customer
    await transporter.sendMail({
      from: '"WARU Hosting" <adeelimran467@gmail.com>',
      to: order.customerDetails.email,
      subject: "Payment Approved - cPanel Credentials Coming Soon",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981; margin-bottom: 20px;">✅ Payment Approved!</h2>
            <p style="color: #4a5568; line-height: 1.6;">Hi ${order.customerDetails.name},</p>
            <p style="color: #4a5568; line-height: 1.6;">Great news! Your payment has been verified and approved.</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Order Details</h3>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p style="margin: 5px 0;"><strong>Plan:</strong> ${order.planId.name}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> Rs ${order.amount}</p>
              <p style="margin: 5px 0;"><strong>Billing Cycle:</strong> ${order.billingCycle}</p>
            </div>
            <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>🚀 What's Next?</strong></p>
              <p style="margin: 10px 0 0 0; color: #1e40af;">Our team is setting up your hosting account. You will receive your cPanel credentials via email within 6 hours.</p>
            </div>
            <div style="background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;"><strong>🎉 Your hosting will include:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #065f46;">
                <li>cPanel Username & Password</li>
                <li>cPanel Login URL</li>
                <li>Name Servers for domain configuration</li>
                <li>Service activation date & expiry date</li>
              </ul>
            </div>
            <p style="color: #4a5568; line-height: 1.6;">Thank you for choosing WARU Hosting!</p>
            <p style="color: #4a5568; line-height: 1.6;">Best regards,<br><strong>WARU Hosting Team</strong></p>
          </div>
        </div>
      `
    });
    
    res.status(200).json({ 
      message: "Payment verified - Service created. Add cPanel credentials to activate.", 
      order,
      service
    });
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

module.exports = router;

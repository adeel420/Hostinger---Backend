const express = require("express");
const router = express.Router();
const Contact = require("../models/contactModel");
const transporter = require("../middleware/config");

// Submit contact form
router.post("/submit", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save to database
    const contact = new Contact({ name, email, subject, message });
    await contact.save();

    // Send email to admin
    await transporter.sendMail({
      from: '"HostPro Contact" <adeelimran467@gmail.com>',
      to: "adeelimran467@gmail.com",
      subject: `New Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">New Contact Form Submission</h2>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            </div>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="margin: 10px 0 0 0; line-height: 1.6;">${message}</p>
            </div>
          </div>
        </div>
      `
    });

    // Send confirmation email to customer
    await transporter.sendMail({
      from: '"HostPro Support" <adeelimran467@gmail.com>',
      to: email,
      subject: "We received your message - HostPro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
            <p style="color: #4a5568; line-height: 1.6;">Hi ${name},</p>
            <p style="color: #4a5568; line-height: 1.6;">We have received your message and our team will get back to you within 24 hours.</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Your Message:</strong></p>
              <p style="margin: 10px 0 0 0; color: #718096;">${message}</p>
            </div>
            <p style="color: #4a5568; line-height: 1.6;">Best regards,<br><strong>HostPro Support Team</strong></p>
          </div>
        </div>
      `
    });

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get all contacts (admin only)
router.get("/all", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

module.exports = router;

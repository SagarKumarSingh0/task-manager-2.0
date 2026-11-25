const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const nodemailer = require('nodemailer');

// Email Transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 1. Save to Database (for safety)
  const contact = await Contact.create({ name, email, subject, message });

  // 2. Send Email to Admin (You)
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"TaskFlow Support" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Tumhara email
        replyTo: email, // Customer ka email (taaki tum direct reply kar sako)
        subject: `🚨 New Support Ticket: ${subject}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f1f5f9; padding: 10px; border-radius: 5px;">${message}</p>
        `
      });
      console.log('✅ Email sent to admin');
    } else {
      console.log('⚠️ Email not configured in .env');
    }
  } catch (err) {
    console.error('❌ Email failed to send:', err.message);
    // Even if email fails, DB save is successful, so we don't crash
  }

  res.status(201).json({ ok: true, id: contact._id });
});

exports.listContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
  res.json(contacts);
});
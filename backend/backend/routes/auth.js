const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendResetEmail } = require('../utils/email');

// ------------------------------
// SIGNUP
// ------------------------------
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default role = 'user')
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user', // you can change to 'admin' for testing
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ------------------------------
// LOGIN
// ------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

console.log("Email entered:", email);
console.log("User found:", user);

if (!user) {
  return res.status(401).json({
    message: "Invalid email or password."
  });
}

console.log("Stored hash:", user.password);
const isMatch = await bcrypt.compare(password, user.password);

console.log("Password match:", isMatch);


    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ------------------------------
// FORGOT PASSWORD (you already have)
// ------------------------------
router.post('/forgot-password', async (req, res) => {
  // ... your existing code ...
});

// ------------------------------
// RESET PASSWORD (you already have)
// ------------------------------
router.post('/reset-password', async (req, res) => {
  // ... your existing code ...
});

module.exports = router;
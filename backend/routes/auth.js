const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || 'sneakerhub-secret-2026-key-change-me';

// ============================================
// VERIFY APPS SCRIPT TOKEN (Fixed signature verification)
// ============================================
function verifyAppsScriptToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    // Handle base64 padding properly
    let payloadBase64 = parts[0];
    while (payloadBase64.length % 4) payloadBase64 += '=';
    
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    
    // Check expiry
    if (Date.now() > payload.exp) return null;
    
    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', APPS_SCRIPT_SECRET)
      .update(parts[0])
      .digest('hex');
    
    if (parts[1] !== expectedSignature) {
      console.error('Apps Script signature mismatch');
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

// ============================================
// IS SIGNED IN MIDDLEWARE (Fixed + more robust)
// ============================================
exports.isSignedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Try 1: Standard backend JWT (3 parts)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { _id: decoded.userId || decoded._id || decoded.id, ...decoded };
      return next();
    } catch (oldErr) {
      // Not a standard JWT
    }

    // Try 2: Apps Script token (2 parts)
    const payload = verifyAppsScriptToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    // Find or create user in MongoDB
    let dbUser = await User.findOne({ email: payload.email });
    
    if (!dbUser) {
      dbUser = new User({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        role: payload.role || 'user',
      });
      await dbUser.save();
    }
    
    req.user = dbUser;
    return next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ success: false, message: 'Auth failed' });
  }
};

// ============================================
// AUTH ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { sendResetEmail } = require('../utils/email');

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
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

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
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

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetEmail(email, resetToken);
    res.json({ message: 'Reset email sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = { isSignedIn: exports.isSignedIn, router };
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
const User = require("./models/User");

// ─── OTP Store (use Redis in production) ────────────────────────────────────
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Load Payment Controller ─────────────────────────────────────────────
const paymentController = require("./controllers/payment");

// ─── Product Model ─────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  oldPrice: { type: Number, default: 0 },
  category: String,
  imageUrl: String,
  stock: { type: Number, default: 0 },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────
const isSignedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Try 1: Standard JWT (3 parts)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { _id: decoded.id || decoded.userId, ...decoded };
      return next();
    } catch (oldErr) {
      // Not standard JWT
    }

    // Try 2: Apps Script token (2 parts) — for OAuth users
    try {
      const parts = token.split('.');
      if (parts.length !== 2) throw new Error('Invalid token format');
      
      let payloadBase64 = parts[0];
      while (payloadBase64.length % 4) payloadBase64 += '=';
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      
      if (Date.now() > payload.exp) {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      
      let dbUser = await User.findOne({ email: payload.email });
      if (!dbUser) {
        dbUser = new User({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          role: payload.role || 'user',
          password: require('crypto').randomBytes(16).toString('hex'),
        });
        await dbUser.save();
      }
      req.user = dbUser;
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Auth failed' });
  }
};

// ─── Admin Middleware ──────────────────────────────────────────────────────
const adminOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log('Admin auth error:', err.message);
    return res.status(401).json({ success: false, message: 'Auth failed: ' + err.message });
  }
};

// ─── DB Connection ─────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studentDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Connection Error:", err));

// ─── Test Routes ───────────────────────────────────────────────────────────
app.get("/ping", (req, res) => res.send("pong"));
app.get("/test", (req, res) => res.json({ message: "Backend is working fine" }));

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ROUTES (Node.js + MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Signup ────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: "Signup successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ 
        message: "This account was created with OAuth. Please use forgot password to set a password." 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Forgot Password (Node.js stores OTP, Apps Script sends email) ─────────
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP and store in Node.js memory
    const otp = generateOTP();
    otpStore.set(email, { 
      otp, 
      userId: user._id.toString(),
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Call Apps Script ONLY to send email
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    
    if (!APPS_SCRIPT_URL) {
      console.error("APPS_SCRIPT_URL not set in .env");
      return res.status(500).json({ message: "Server not configured for email" });
    }

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendOTP',
          email: email,
          otp: otp,
          name: user.name,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        res.json({ message: "OTP sent to your email" });
      } else {
        res.status(500).json({ message: "Failed to send OTP: " + result.message });
      }
    } catch (fetchError) {
      console.error("Apps Script fetch failed:", fetchError.message);
      // Still return success if OTP was stored — user can see it in console for testing
      res.json({ 
        message: "OTP generated (email service unavailable)", 
        debug_otp: otp // Remove in production!
      });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────────────────
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ message: "OTP expired or not requested" });
    }
    
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }
    
    if (stored.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: stored.userId, email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ 
      message: "OTP verified", 
      resetToken 
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── Reset Password ────────────────────────────────────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    
    if (!resetToken || !password) {
      return res.status(400).json({ message: "Reset token and password are required" });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password — pre('save') hook will hash it
    user.password = password;
    await user.save();

    // Clear OTP
    otpStore.delete(decoded.email);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Reset token expired" });
    }
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/products", adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/products/:id", adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/products/:id", adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEED ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/seed", async (req, res) => {
  const seedProducts = [
    { name: 'Nike Sport', price: 3999, oldPrice: 4999, imageUrl: '/nikesport.png', category: 'bestselling', stock: 10 },
    { name: 'Sneaker Shoe for Man', price: 2999, oldPrice: 4999, imageUrl: '/snekerblue.png', category: 'bestselling', stock: 10 },
    { name: 'Trendy Slick Shoe', price: 3999, oldPrice: 4999, imageUrl: '/whiteshoe2.png', category: 'bestselling', stock: 10 },
    { name: 'Slick Running', price: 2999, oldPrice: 4999, imageUrl: '/slick.png', category: 'bestselling', stock: 10 },
    { name: 'Formal Canvas Shoe', price: 2999, oldPrice: 4999, imageUrl: 'canvasshoe.png', category: 'bestselling', stock: 10 },
    { name: 'Running Shoe', price: 2999, oldPrice: 4999, imageUrl: '/running.png', category: 'bestselling', stock: 10 },
  ];

  try {
    await Product.deleteMany({ category: 'bestselling' });
    await Product.insertMany(seedProducts);
    res.json({ success: true, message: 'Best selling products seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/seed/man", async (req, res) => {
  const seedProducts = [
    { name: 'Running Shoe', price: 2999, oldPrice: 4999, imageUrl: '/running.png', category: 'man', stock: 10 },
    { name: 'Black Shoe', price: 5999, oldPrice: 6999, imageUrl: '/black.png', category: 'man', stock: 10 },
    { name: 'Trendy Slick Pro', price: 3999, oldPrice: 4999, imageUrl: '/whiteshoe2.png', category: 'man', stock: 10 },
    { name: 'Formal Canvas Shoe', price: 2999, oldPrice: 4999, imageUrl: 'canvasshoe.png', category: 'man', stock: 10 },
    { name: 'Babal Shoe', price: 3000, oldPrice: 4999, imageUrl: '/babal.png', category: 'man', stock: 10 },
    { name: 'Arke Shoe', price: 4000, oldPrice: 5000, imageUrl: '/arke.png', category: 'man', stock: 10 },
  ];

  try {
    await Product.deleteMany({ category: 'man' });
    await Product.insertMany(seedProducts);
    res.json({ success: true, message: 'Man products seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/seed/women", async (req, res) => {
  const seedProducts = [
    { name: 'White Shoe', price: 2000, oldPrice: 3999, imageUrl: '/pink.png', category: 'women', stock: 10 },
    { name: 'Grey Shoe', price: 3500, oldPrice: 4999, imageUrl: '/Grey.png', category: 'women', stock: 10 },
    { name: 'Style Shoe', price: 4000, oldPrice: 5999, imageUrl: '/style.png', category: 'women', stock: 10 },
    { name: 'Jogging Shoe', price: 3000, oldPrice: 4999, imageUrl: '/jogging.png', category: 'women', stock: 10 },
    { name: 'Mix Sneaker', price: 4000, oldPrice: 5999, imageUrl: '/mix.png', category: 'women', stock: 10 },
    { name: 'Rose Shoe', price: 2500, oldPrice: 4999, imageUrl: '/rose.png', category: 'women', stock: 10 },
  ];

  try {
    await Product.deleteMany({ category: 'women' });
    await Product.insertMany(seedProducts);
    res.json({ success: true, message: 'Women products seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/seed/children", async (req, res) => {
  const seedProducts = [
    { name: 'Cartoon Shoe', price: 2200, oldPrice: 3999, imageUrl: 'cartoon.png', category: 'children', stock: 10 },
    { name: 'Lightning Shoe', price: 2500, oldPrice: 3999, imageUrl: 'lightning.png', category: 'children', stock: 10 },
    { name: 'Superman Shoe', price: 3000, oldPrice: 3799, imageUrl: 'superman.png', category: 'children', stock: 10 },
    { name: 'Comfort Shoe', price: 1500, oldPrice: 2999, imageUrl: 'comfort.png', category: 'children', stock: 10 },
    { name: 'Adidas Shoe', price: 1500, oldPrice: 2999, imageUrl: 'adikid.png', category: 'children', stock: 10 },
    { name: 'Grey Shoe', price: 1800, oldPrice: 3499, imageUrl: 'greykid.png', category: 'children', stock: 10 },
  ];

  try {
    await Product.deleteMany({ category: 'children' });
    await Product.insertMany(seedProducts);
    res.json({ success: true, message: 'Children products seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/payment/esewa/test-signature', paymentController.testEsewaSignature);
app.post('/api/payment/esewa/initiate', isSignedIn, paymentController.initiateEsewaPayment);
app.get('/api/payment/esewa/success', paymentController.handleEsewaSuccess);
app.get('/api/payment/esewa/failure', paymentController.handleEsewaFailure);
app.post('/api/payment/khalti/initiate', isSignedIn, paymentController.initiateKhaltiPayment);
app.get('/api/payment/khalti/verify', paymentController.verifyKhaltiPayment);
app.post('/api/payment/cod/initiate', isSignedIn, paymentController.initiateCOD);

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
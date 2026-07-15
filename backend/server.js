// ═══════════════════════════════════════════════════════════════
// server.js  (BACKEND — Node.js + Express + MongoDB)
// ═══════════════════════════════════════════════════════════════

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

// DEBUG: Verify controller loaded correctly
console.log('Payment controller loaded:', Object.keys(paymentController));
console.log('testEsewaSignature type:', typeof paymentController.testEsewaSignature);

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
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Auth failed: ' + err.message });
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
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ─── Signup ────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account was created with OAuth. Please use forgot password to set a password."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── Google OAuth Signup/Login ────────────────────────────────────────────
app.post("/api/auth/google", async (req, res) => {
  try {
    const { name, email, googleId, picture } = req.body;
    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: "Email and Google ID are required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        googleId,
        picture: picture || null,
        role: 'user'
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (picture) user.picture = picture;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── Facebook OAuth Signup/Login ────────────────────────────────────────────
app.post("/api/auth/facebook", async (req, res) => {
  try {
    const { name, email, facebookId, picture } = req.body;
    if (!email || !facebookId) {
      return res.status(400).json({ success: false, message: "Email and Facebook ID are required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        facebookId,
        picture: picture || null,
        role: 'user'
      });
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      if (picture) user.picture = picture;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Facebook login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
app.post("/api/auth/forgot-password", async (req, res) => {
  console.log("→ POST /api/auth/forgot-password hit", req.body);
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      userId: user._id.toString(),
      expires: Date.now() + 10 * 60 * 1000
    });

    console.log(`OTP for ${email}: ${otp}`);

    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

    if (!APPS_SCRIPT_URL) {
      console.error("APPS_SCRIPT_URL not set in .env");
      return res.status(500).json({ success: false, message: "Server not configured for email" });
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
        res.json({ success: true, message: "OTP sent to your email" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send OTP: " + result.message });
      }
    } catch (fetchError) {
      console.error("Apps Script fetch failed:", fetchError.message);
      res.json({
        success: true,
        message: "OTP generated (email service unavailable)",
        debug_otp: otp
      });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────────────────
app.post("/api/auth/verify-otp", async (req, res) => {
  console.log("→ POST /api/auth/verify-otp hit", req.body);
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ success: false, message: "OTP expired or not requested" });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const resetToken = jwt.sign(
      { id: stored.userId, email },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      message: "OTP verified",
      resetToken
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── Reset Password ────────────────────────────────────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  console.log("→ POST /api/auth/reset-password hit", req.body);
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({ success: false, message: "Reset token and password are required" });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = password;
    await user.save();

    otpStore.delete(decoded.email);

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: "Reset token expired" });
    }
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── Get Current User ────────────────────────────────────────────────────────
app.get("/api/auth/me", isSignedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
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
  console.log(`Auth routes available:`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/auth/google`);
  console.log(`  POST /api/auth/facebook`);
  console.log(`  POST /api/auth/forgot-password`);
  console.log(`  POST /api/auth/verify-otp`);
  console.log(`  POST /api/auth/reset-password`);
});
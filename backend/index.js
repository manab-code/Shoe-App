// ------------------------------
// 1. Load environment variables
// ------------------------------
require('dotenv').config();

// ------------------------------
// 2. Import dependencies
// ------------------------------
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

// Import auth routes
const authRoutes = require('./routes/auth');
console.log('🔥 Auth routes loaded successfully');

// ------------------------------
// 3. Create Express app  ← MUST BE BEFORE ANY ROUTES!
// ------------------------------
const app = express();

// ------------------------------
// 4. Middleware
// ------------------------------
app.use(cors());
app.use(express.json());

// ✅ DEBUG: log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ------------------------------
// 5. Database connection
// ------------------------------
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ------------------------------
// 6. Import User model
// ------------------------------
const User = require('./models/User');

// ------------------------------
// 7. CRUD routes
// ------------------------------
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
});

app.put('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

app.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// ------------------------------
// 8. Claude Proxy (optional)
// ------------------------------
app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'YOUR_API_KEY_HERE',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 9. PAYMENT ROUTES (Khalti + eSewa + COD)
// ═══════════════════════════════════════════════════════════════

// ─── Payment Order Schema ─────────────────────────────────────
const orderSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  amount: Number,
  method: { type: String, enum: ['khalti', 'esewa', 'cod'] },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cod_placed'], default: 'pending' },
  transactionId: String,
  pidx: String,
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

// ─── Khalti Config ──────────────────────────────────────────
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://khalti.com/api/v2' 
  : 'https://dev.khalti.com/api/v2';

// ─── eSewa Config ───────────────────────────────────────────
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q(';
const ESEWA_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://epay.esewa.com.np'
  : 'https://rc-epay.esewa.com.np';
const ESEWA_STATUS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://esewa.com.np'
  : 'https://rc.esewa.com.np';

// ─── Helper: Generate HMAC-SHA256 Signature ───────────────
function generateEsewaSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// ─── Khalti: Initiate Payment ─────────────────────────────────
app.post('/api/payment/khalti/initiate', async (req, res) => {
  try {
    const { amount, productName, productId, customerName, customerEmail, customerPhone } = req.body;

    const order = await Order.create({
      productId,
      productName,
      amount,
      method: 'khalti',
      status: 'pending',
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || 'customer@example.com',
      customerPhone: customerPhone || '9800000001',
    });

    const payload = {
      return_url: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/payment/khalti/verify`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      amount: amount * 100,
      purchase_order_id: order._id.toString(),
      purchase_order_name: productName,
      customer_info: {
        name: customerName || 'Customer',
        email: customerEmail || 'customer@example.com',
        phone: customerPhone || '9800000001',
      },
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}/epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    order.pidx = response.data.pidx;
    await order.save();

    res.json({
      success: true,
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
      orderId: order._id,
    });
  } catch (error) {
    console.error('Khalti initiate error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.response?.data || error.message,
    });
  }
});

// ─── Khalti: Verify Payment ───────────────────────────────────
app.get('/api/payment/khalti/verify', async (req, res) => {
  try {
    const { pidx, status, transaction_id } = req.query;

    if (status !== 'Completed') {
      await Order.findOneAndUpdate({ pidx }, { status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=cancelled`);
    }

    const verifyResponse = await axios.post(
      `${KHALTI_BASE_URL}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (verifyResponse.data.status === 'Completed') {
      await Order.findOneAndUpdate(
        { pidx },
        { status: 'completed', transactionId: transaction_id }
      );

      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?method=khalti&transaction_id=${transaction_id}&order_id=${verifyResponse.data.purchase_order_id}`
      );
    } else {
      await Order.findOneAndUpdate({ pidx }, { status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=verification_failed`);
    }
  } catch (error) {
    console.error('Khalti verify error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=server_error`);
  }
});

// ─── eSewa: Initiate Payment ────────────────────────────────
app.post('/api/payment/esewa/initiate', async (req, res) => {
  try {
    const { amount, productName, productId, customerName, customerEmail } = req.body;

    const order = await Order.create({
      productId,
      productName,
      amount,
      method: 'esewa',
      status: 'pending',
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || 'customer@example.com',
    });

    const transactionUuid = order._id.toString();
    const totalAmount = parseFloat(amount);

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_MERCHANT_ID}`;
    
    const signature = generateEsewaSignature(message, ESEWA_SECRET_KEY);

    const payload = {
      amount: String(amount),
      tax_amount: '0',
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_ID,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/payment/esewa/success`,
      failure_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=esewa_failed`,
      signed_field_names: signedFieldNames,
      signature: signature,
    };

    res.json({
      success: true,
      esewa_url: `${ESEWA_BASE_URL}/api/epay/main/v2/form`,
      payload: payload,
      orderId: order._id,
    });
  } catch (error) {
    console.error('❌ Esewa initiate error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Esewa payment initiation failed',
      error: error.message,
    });
  }
});

// ─── eSewa: Success Callback (GET with ?data=base64) ─────────
app.get('/api/payment/esewa/success', async (req, res) => {
  try {
    const encodedData = req.query.data;
    
    if (!encodedData) {
      console.error('❌ No data received from eSewa');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=no_data_from_esewa`);
    }

    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    const responseData = JSON.parse(decodedData);
    
    console.log('✅ eSewa callback data:', responseData);

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature
    } = responseData;

    if (status !== 'COMPLETE') {
      await Order.findByIdAndUpdate(transaction_uuid, { status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=esewa_status_${status}`);
    }

    const fields = signed_field_names.split(',');
    const message = fields.map(field => `${field}=${responseData[field]}`).join(',');
    const expectedSignature = generateEsewaSignature(message, ESEWA_SECRET_KEY);

    if (signature !== expectedSignature) {
      console.error('❌ Signature mismatch!');
      console.error('Expected:', expectedSignature);
      console.error('Received:', signature);
      await Order.findByIdAndUpdate(transaction_uuid, { status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=invalid_signature`);
    }

    await Order.findByIdAndUpdate(transaction_uuid, {
      status: 'completed',
      transactionId: transaction_code,
    });

    console.log('✅ eSewa payment verified:', transaction_code);

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?method=esewa&transaction_id=${transaction_code}&order_id=${transaction_uuid}&amount=${total_amount}`
    );
  } catch (error) {
    console.error('❌ Esewa success handler error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?reason=server_error`);
  }
});

// ─── eSewa: Status Check API ────────────────────────────────
app.get('/api/payment/esewa/status', async (req, res) => {
  try {
    const { product_code, total_amount, transaction_uuid } = req.query;

    const response = await axios.get(
      `${ESEWA_STATUS_BASE_URL}/api/epay/transaction/status/`,
      {
        params: { product_code, total_amount, transaction_uuid },
        timeout: 10000,
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('❌ Esewa status check error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.response?.data || error.message,
    });
  }
});

// ─── COD: Initiate Order ──────────────────────────────────────
app.post('/api/payment/cod/initiate', async (req, res) => {
  console.log('📦 COD endpoint HIT! Body:', req.body);
  try {
    const { amount, productName, productId, customerName, customerEmail, customerPhone } = req.body;

    const transactionId = 'COD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const order = await Order.create({
      productId,
      productName,
      amount,
      method: 'cod',
      status: 'cod_placed',
      transactionId: transactionId,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || 'customer@example.com',
      customerPhone: customerPhone || '9800000001',
    });

    console.log('✅ COD Order created:', order._id.toString(), 'Transaction:', transactionId);

    res.json({
      success: true,
      message: 'Cash on Delivery order placed successfully',
      transactionId: transactionId,
      orderId: order._id,
      order: {
        productName: order.productName,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ COD initiate error:', error.message);
    res.status(500).json({
      success: false,
      message: 'COD order placement failed',
      error: error.message,
    });
  }
});

// ─── Get Order Status ─────────────────────────────────────────
app.get('/api/payment/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Get All Orders (Admin) ─────────────────────────────────
app.get('/api/payment/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── MOUNT AUTH ROUTES ────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Start the server ───────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`   Auth:            http://localhost:${PORT}/api/auth`);
  console.log(`   Khalti initiate: http://localhost:${PORT}/api/payment/khalti/initiate`);
  console.log(`   eSewa initiate:  http://localhost:${PORT}/api/payment/esewa/initiate`);
  console.log(`   COD initiate:    http://localhost:${PORT}/api/payment/cod/initiate`);
});
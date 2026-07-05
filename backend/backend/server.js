// ================================================================
// FILE: server.js — Main Express Backend
// ================================================================

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
// 3. Create Express app
// ------------------------------
const app = express();

// ------------------------------
// 4. Middleware
// ------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentDB')
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
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cod_placed', 'paid and processing'], default: 'pending' },
  transactionId: String,
  pidx: String,
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

// ─── Config ───────────────────────────────────────────────────
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://khalti.com/api/v2' 
  : 'https://dev.khalti.com/api/v2';

// FIXED: Use MERCHANT_CODE (not MERCHANT_ID) to match eSewa API
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_PAYMENT_URL = process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL || 'https://rc-epay.esewa.com.np/api/epay/transaction/status';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// ─── eSewa Signature Helper ───────────────────────────────────
function generateEsewaSignature(totalAmount, transactionUuid, productCode) {
  // Ensure amount is string with exactly 2 decimal places
  const amountStr = Number(totalAmount).toFixed(2);
  const message = `total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  
  const signature = crypto
    .createHmac('sha256', ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');
  
  return signature;
}

// ─── TEST: eSewa Signature ────────────────────────────────────
app.get('/api/payment/esewa/test-signature', (req, res) => {
  const testAmount = '100.00';
  const testUuid = '241028';
  
  const signature = generateEsewaSignature(testAmount, testUuid, ESEWA_MERCHANT_CODE);
  
  res.json({
    message: 'eSewa Signature Test',
    config: {
      merchant_code: ESEWA_MERCHANT_CODE,
      secret_key_length: ESEWA_SECRET_KEY.length,
      payment_url: ESEWA_PAYMENT_URL,
    },
    test: {
      amount: testAmount,
      uuid: testUuid,
      product_code: ESEWA_MERCHANT_CODE,
      message: `total_amount=${testAmount},transaction_uuid=${testUuid},product_code=${ESEWA_MERCHANT_CODE}`,
      generated_signature: signature,
    },
    expected_reference: {
      message: 'total_amount=100,transaction_uuid=241028,product_code=EPAYTEST',
      signature: 'i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=',
    }
  });
});

// ─── eSewa: Initiate Payment ──────────────────────────────────
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
    const totalAmount = Number(amount).toFixed(2);

    const signature = generateEsewaSignature(totalAmount, transactionUuid, ESEWA_MERCHANT_CODE);

    // CRITICAL: ALL values must be STRINGS for the form
    const payload = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_CODE,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${BACKEND_URL}/api/payment/esewa/success`,
      failure_url: `${BACKEND_URL}/api/payment/esewa/failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature,
    };

    console.log('=== ESEWA PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));

    res.json({
      success: true,
      esewa_url: ESEWA_PAYMENT_URL,
      payload: payload,
      orderId: order._id,
    });
  } catch (error) {
    console.error('Esewa initiate error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Esewa payment initiation failed',
      error: error.message,
    });
  }
});

// ─── eSewa: Success Handler (GET with query param) ────────────
// eSewa redirects here with ?data=BASE64 after payment
app.get('/api/payment/esewa/success', async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      console.error('No data from eSewa');
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=No data received from eSewa`);
    }

    // Decode Base64
    let decodedData;
    try {
      const decodedString = Buffer.from(data, 'base64').toString('utf-8');
      decodedData = JSON.parse(decodedString);
    } catch (e) {
      console.error('Failed to decode eSewa data:', e);
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Invalid data format from eSewa`);
    }

    console.log('=== ESEWA CALLBACK DATA ===');
    console.log(JSON.stringify(decodedData, null, 2));

    // Verify callback signature
    const expectedSignature = generateEsewaSignature(
      decodedData.total_amount,
      decodedData.transaction_uuid,
      decodedData.product_code
    );

    if (decodedData.signature !== expectedSignature) {
      console.error('SIGNATURE MISMATCH!');
      console.error('Expected:', expectedSignature);
      console.error('Received:', decodedData.signature);
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Invalid signature`);
    }

    if (decodedData.status !== 'COMPLETE') {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Payment status: ${decodedData.status}`);
    }

    // Server-to-server verification
    const isVerified = await verifyWithEsewaServer(
      decodedData.transaction_uuid,
      decodedData.total_amount
    );

    if (!isVerified) {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Server verification failed`);
    }

    // Update order
    const order = await Order.findById(decodedData.transaction_uuid);
    if (!order) {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Order not found`);
    }

    if (order.status === 'paid and processing') {
      return res.redirect(`${FRONTEND_URL}/payment/success?method=esewa&transaction_id=${decodedData.transaction_code}`);
    }

    order.status = 'paid and processing';
    order.transactionId = decodedData.transaction_code;
    await order.save();

    console.log('✅ eSewa payment successful, order updated:', order._id);

    return res.redirect(`${FRONTEND_URL}/payment/success?method=esewa&transaction_id=${decodedData.transaction_code}`);

  } catch (error) {
    console.error('Esewa success handler error:', error);
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
});

// ─── eSewa: Server-to-Server Verification ─────────────────────
async function verifyWithEsewaServer(transactionUuid, totalAmount) {
  try {
    const url = new URL(ESEWA_STATUS_URL);
    url.searchParams.append('product_code', ESEWA_MERCHANT_CODE);
    url.searchParams.append('transaction_uuid', transactionUuid);
    url.searchParams.append('total_amount', totalAmount);

    console.log('Verifying with eSewa:', url.toString());

    const response = await axios.get(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    console.log('eSewa verification response:', response.data);

    return response.data.status === 'COMPLETE' || response.data.status === 'SUCCESS';

  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    return false;
  }
}

// ─── eSewa: Failure Handler ───────────────────────────────────
app.get('/api/payment/esewa/failure', async (req, res) => {
  try {
    const { data } = req.query;
    let decodedData = {};

    if (data) {
      try {
        decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      } catch (e) {}
    }

    console.log('eSewa failure:', decodedData);

    if (decodedData.transaction_uuid) {
      await Order.findByIdAndUpdate(decodedData.transaction_uuid, { status: 'failed' });
    }

    const reason = decodedData.status || 'Payment cancelled or failed';
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(reason)}`);

  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
});

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
      return_url: `${BACKEND_URL}/api/payment/khalti/verify`,
      website_url: FRONTEND_URL,
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
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=cancelled`);
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
        `${FRONTEND_URL}/payment/success?method=khalti&transaction_id=${transaction_id}&order_id=${verifyResponse.data.purchase_order_id}`
      );
    } else {
      await Order.findOneAndUpdate({ pidx }, { status: 'failed' });
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=verification_failed`);
    }
  } catch (error) {
    console.error('Khalti verify error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/payment/failed?reason=server_error`);
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

// ═══════════════════════════════════════════════════════════════

// ------------------------------
// 10. MOUNT AUTH ROUTES
// ------------------------------
app.use('/api/auth', authRoutes);

// ------------------------------
// 11. Start the server
// ------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on ${PORT}`);
  console.log(`   Auth:            http://localhost:${PORT}/api/auth`);
  console.log(`   Khalti initiate: http://localhost:${PORT}/api/payment/khalti/initiate`);
  console.log(`   eSewa initiate:  http://localhost:${PORT}/api/payment/esewa/initiate`);
  console.log(`   eSewa test:      http://localhost:${PORT}/api/payment/esewa/test-signature`);
  console.log(`   COD initiate:    http://localhost:${PORT}/api/payment/cod/initiate`);
});
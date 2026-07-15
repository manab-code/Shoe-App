const crypto = require('crypto');
const Order = require('../models/order');
const Payment = require('../models/payment');

const ESEWA_CONFIG = {
  MERCHANT_CODE: process.env.ESEWA_MERCHANT_CODE,
  SECRET_KEY: process.env.ESEWA_SECRET_KEY,
  PAYMENT_URL: process.env.ESEWA_PAYMENT_URL,
  STATUS_URL: process.env.ESEWA_STATUS_URL,
};

const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

function generateSignature(totalAmount, transactionUuid, productCode) {
  const amountStr = Number(totalAmount).toFixed(2);
  const message = `total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = crypto.createHmac('sha256', ESEWA_CONFIG.SECRET_KEY).update(message).digest('base64');
  console.log('=== SIGNATURE DEBUG ===');
  console.log('Message:', message);
  console.log('Generated Signature:', signature);
  return signature;
}

function buildEsewaPayload(order) {
  const totalAmount = Number(order.amount).toFixed(2);
  const transactionUuid = order._id.toString();
  const productCode = ESEWA_CONFIG.MERCHANT_CODE;
  const signature = generateSignature(totalAmount, transactionUuid, productCode);
  return {
    amount: totalAmount,
    tax_amount: '0',
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: `${BACKEND_URL}/api/payment/esewa/success`,
    failure_url: `${BACKEND_URL}/api/payment/esewa/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: signature,
  };
}

const testEsewaSignature = (req, res) => {
  const testAmount = '100.00';
  const testUuid = 'TEST-ORDER-123';
  const testProductCode = ESEWA_CONFIG.MERCHANT_CODE;
  const signature = generateSignature(testAmount, testUuid, testProductCode);
  res.json({
    message: 'Signature test',
    config: {
      merchant_code: ESEWA_CONFIG.MERCHANT_CODE,
      secret_key_length: ESEWA_CONFIG.SECRET_KEY?.length,
      payment_url: ESEWA_CONFIG.PAYMENT_URL,
    },
    test: {
      amount: testAmount,
      uuid: testUuid,
      product_code: testProductCode,
      generated_signature: signature,
    }
  });
};

const initiateEsewaPayment = async (req, res) => {
  try {
    const { productId, productName, amount } = req.body;
    const userId = req.user._id;
    console.log('=== ESEWA INITIATE ===');
    console.log('Body:', req.body);
    console.log('userId:', userId);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const order = new Order({
      user: userId,
      products: [{ product: productId, quantity: 1 }],
      amount: parseFloat(amount),
      status: 'pending',
      payment_method: 'esewa',
    });
    await order.save();
    console.log('Order created:', order._id.toString());
    const payload = buildEsewaPayload(order);
    res.json({
      success: true,
      message: 'Payment initiated',
      esewa_url: ESEWA_CONFIG.PAYMENT_URL,
      payload,
    });
  } catch (err) {
    console.error('Initiate payment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const handleEsewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) {
      console.error('No data from eSewa');
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=No data received from eSewa`);
    }
    let decodedData;
    try {
      const decodedString = Buffer.from(data, 'base64').toString('utf-8');
      decodedData = JSON.parse(decodedString);
    } catch (e) {
      console.error('Failed to decode eSewa data:', e);
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Invalid data format from eSewa`);
    }
    console.log('=== ESEWA CALLBACK ===');
    console.log(JSON.stringify(decodedData, null, 2));
    const expectedSignature = generateSignature(decodedData.total_amount, decodedData.transaction_uuid, decodedData.product_code);
    if (decodedData.signature !== expectedSignature) {
      console.error('SIGNATURE MISMATCH!');
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Invalid signature`);
    }
    if (decodedData.status !== 'COMPLETE') {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Payment status: ${decodedData.status}`);
    }
    const isVerified = await verifyWithEsewaServer(decodedData.transaction_uuid, decodedData.total_amount);
    if (!isVerified) {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Server verification failed`);
    }
    const order = await Order.findById(decodedData.transaction_uuid);
    if (!order) {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Order not found`);
    }
    if (order.status === 'paid and processing') {
      return res.redirect(`${FRONTEND_URL}/payment/success?method=esewa&transaction_id=${decodedData.transaction_code}`);
    }
    order.status = 'paid and processing';
    order.transaction_id = decodedData.transaction_code;
    await order.save();
    await new Payment({
      user: order.user,
      order: order._id,
      source_payment_id: decodedData.transaction_code,
      amount: parseFloat(decodedData.total_amount),
      status: 'completed',
      payment_method: 'esewa',
      raw_response: decodedData,
    }).save();
    return res.redirect(`${FRONTEND_URL}/payment/success?method=esewa&transaction_id=${decodedData.transaction_code}`);
  } catch (err) {
    console.error('eSewa success error:', err);
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(err.message)}`);
  }
};

async function verifyWithEsewaServer(transactionUuid, totalAmount) {
  try {
    const url = new URL(ESEWA_CONFIG.STATUS_URL);
    url.searchParams.append('product_code', ESEWA_CONFIG.MERCHANT_CODE);
    url.searchParams.append('transaction_uuid', transactionUuid);
    url.searchParams.append('total_amount', totalAmount);
    console.log('Verifying with eSewa:', url.toString());
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      console.error('eSewa status API error:', response.status, await response.text());
      return false;
    }
    const result = await response.json();
    console.log('eSewa verification:', result);
    return result.status === 'COMPLETE' || result.status === 'SUCCESS';
  } catch (err) {
    console.error('Verification error:', err);
    return false;
  }
}

const handleEsewaFailure = async (req, res) => {
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
      await Order.findByIdAndUpdate(decodedData.transaction_uuid, { status: 'payment_failed' });
    }
    const reason = decodedData.status || 'Payment cancelled or failed';
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(reason)}`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(err.message)}`);
  }
};

const initiateKhaltiPayment = async (req, res) => {
  try {
    const { amount, productName, productId } = req.body;
    const userId = req.user._id;
    console.log('=== KHALTI INITIATE ===');
    console.log('Body:', req.body);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount: ' + amount });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Missing productId' });
    }
    if (!productName) {
      return res.status(400).json({ success: false, message: 'Missing productName' });
    }
    const amountInPaisa = Math.round(parseFloat(amount) * 100);
    const order = new Order({
      user: userId,
      products: [{ product: productId, quantity: 1 }],
      amount: parseFloat(amount),
      status: 'pending',
      payment_method: 'khalti',
    });
    await order.save();
    const secretKey = process.env.KHALTI_SECRET_KEY;
    const frontendUrl = process.env.FRONTEND_URL;
    const backendUrl = process.env.BACKEND_URL;
    if (!secretKey) {
      return res.status(500).json({ success: false, message: 'KHALTI_SECRET_KEY missing in .env' });
    }
    if (!frontendUrl || !backendUrl) {
      return res.status(500).json({ success: false, message: 'FRONTEND_URL and BACKEND_URL must be set in .env' });
    }
    if (secretKey.length === 32 && /^[a-f0-9]+$/.test(secretKey)) {
      console.warn('WARNING: Your KHALTI_SECRET_KEY looks like a Public Key, not a Secret Key!');
      console.warn('Please use the Secret Key from your Khalti dashboard (usually longer).');
    }
    const attempts = [
      { url: 'https://dev.khalti.com/api/v2/epayment/initiate/', auth: `key ${secretKey}` },
      { url: 'https://dev.khalti.com/api/v2/epayment/initiate/', auth: `Key ${secretKey}` },
      { url: 'https://a.khalti.com/api/v2/epayment/initiate/', auth: `Key ${secretKey}` },
      { url: 'https://a.khalti.com/api/v2/epayment/initiate/', auth: secretKey },
    ];
    for (const attempt of attempts) {
      try {
        console.log(`Trying: ${attempt.url} with auth: ${attempt.auth.substring(0, 20)}...`);
        const response = await fetch(attempt.url, {
          method: 'POST',
          headers: {
            'Authorization': attempt.auth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            return_url: `${backendUrl}/api/payment/khalti/verify`,
            website_url: frontendUrl,
            amount: amountInPaisa,
            purchase_order_id: order._id.toString(),
            purchase_order_name: productName,
          }),
        });
        const text = await response.text();
        console.log(`Response from ${attempt.url}:`, response.status, text.substring(0, 200));
        if (response.ok) {
          const data = JSON.parse(text);
          if (data.payment_url) {
            return res.json({ success: true, payment_url: data.payment_url });
          }
        }
      } catch (e) {
        console.log('Attempt failed:', e.message);
      }
    }
    return res.status(400).json({
      success: false,
      message: 'Khalti authentication failed. Your key may be a Public Key. Please use the Secret Key from your Khalti dashboard.',
      hint: 'Secret Keys are usually longer than 32 characters. Check your Khalti dashboard under API Keys or Settings.'
    });
  } catch (err) {
    console.error('Khalti initiate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, status, transaction_id } = req.query;
    if (status !== 'Completed') {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Khalti not completed`);
    }
    const KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/';
    const response = await fetch(KHALTI_LOOKUP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });
    const data = await response.json();
    if (data.status !== 'Completed') {
      return res.redirect(`${FRONTEND_URL}/payment/failed?reason=Khalti verification failed`);
    }
    const order = await Order.findById(data.purchase_order_id);
    if (order) {
      order.status = 'paid and processing';
      order.transaction_id = transaction_id;
      await order.save();
      await new Payment({
        user: order.user,
        order: order._id,
        source_payment_id: transaction_id,
        amount: data.total_amount / 100,
        status: 'completed',
        payment_method: 'khalti',
      }).save();
    }
    return res.redirect(`${FRONTEND_URL}/payment/success?method=khalti&transaction_id=${transaction_id}`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}/payment/failed?reason=${encodeURIComponent(err.message)}`);
  }
};

const initiateCOD = async (req, res) => {
  try {
    const { amount, productName, productId } = req.body;
    const userId = req.user._id;
    console.log('=== COD INITIATE ===');
    console.log('Body:', req.body);
    console.log('userId:', userId);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Missing productId' });
    }
    const order = new Order({
      user: userId,
      products: [{ product: productId, quantity: 1 }],
      amount: parseFloat(amount),
      status: 'pending',
      payment_method: 'cod',
    });
    await order.save();
    res.json({
      success: true,
      transactionId: `COD-${order._id.toString().slice(-8).toUpperCase()}`,
      orderId: order._id,
    });
  } catch (err) {
    console.error('COD initiate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  testEsewaSignature,
  initiateEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateCOD,
};
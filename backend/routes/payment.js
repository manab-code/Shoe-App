const express = require('express');
const router = express.Router();
const { isSignedIn } = require('../controllers/auth');
const {
  initiateEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  testEsewaSignature,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateCOD,
} = require('../controllers/payment');

// Test endpoint - GET (no auth required)
router.get('/esewa/test-signature', testEsewaSignature);

// eSewa
router.post('/esewa/initiate', isSignedIn, initiateEsewaPayment);
router.get('/esewa/success', handleEsewaSuccess);
router.get('/esewa/failure', handleEsewaFailure);

// Khalti
router.post('/khalti/initiate', isSignedIn, initiateKhaltiPayment);
router.get('/khalti/verify', verifyKhaltiPayment);

// COD
router.post('/cod/initiate', isSignedIn, initiateCOD);

module.exports = router;
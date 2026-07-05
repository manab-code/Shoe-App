const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = (to, resetLink) => {
  console.log('📧 MOCK EMAIL — would send to:', to);
  console.log('🔗 Reset link:', resetLink);
  return Promise.resolve(); // fake success
};

module.exports = { sendResetEmail };

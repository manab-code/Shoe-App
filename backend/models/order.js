const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
  }],
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid and processing', 'payment_failed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  payment_method: {
    type: String,
    enum: ['esewa', 'khalti', 'cod'],
    required: true,
  },
  transaction_id: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
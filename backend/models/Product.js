const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  imageUrl: String,
  stock: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // NEW: who created it
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
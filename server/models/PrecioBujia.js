const mongoose = require('mongoose');

const PrecioBujiaSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  precio_cliente: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PrecioBujia', PrecioBujiaSchema);

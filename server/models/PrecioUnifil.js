const mongoose = require('mongoose');

const PrecioUnifilSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  precio: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PrecioUnifil', PrecioUnifilSchema);

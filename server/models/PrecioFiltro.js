const mongoose = require('mongoose');

const PrecioFiltroSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true,
    index: true
  },
  marca: {
    type: String,
    default: 'UNIFIL',
    required: true,
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
}, { timestamps: true, collection: 'preciofiltros' });

// Compound index to ensure uniqueness per brand + SKU combination
PrecioFiltroSchema.index({ clave: 1, marca: 1 }, { unique: true });

module.exports = mongoose.model('PrecioFiltro', PrecioFiltroSchema);

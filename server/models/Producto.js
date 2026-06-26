const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  precioLista: { type: Number, required: true }, // Precio base sin IVA ni margen
  marca: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);

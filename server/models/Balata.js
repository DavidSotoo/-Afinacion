const mongoose = require('mongoose');

const BalataSchema = new mongoose.Schema({
  marca: {
    type: String,
    default: 'Dynamic',
    required: true
  },
  sku_dynamic: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sku_equivalente_wagner: {
    type: String,
    required: true,
    index: true
  },
  fmsi: {
    type: String,
    required: true
  },
  posicion: {
    type: String,
    enum: ['Delantero', 'Trasero'],
    required: true
  },
  vehiculos_compatibles: [
    {
      _id: false,
      modelo: { type: String, required: true },
      anio_inicio: { type: Number, required: true },
      anio_fin: { type: Number, required: true },
      especificaciones: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Balata', BalataSchema);

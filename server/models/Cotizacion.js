const mongoose = require('mongoose');

const CotizacionSchema = new mongoose.Schema({
  folio: {
    type: String,
    required: true,
    unique: true
  },
  vehiculo: {
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    anios: { type: String, required: true },
    motor: { type: String, default: '' },
    litros: { type: String, default: '' },
    cilindros: { type: String, default: '' }
  },
  tipoBujia: {
    type: String,
    required: true
  },
  bujiaSku: {
    type: String,
    default: ''
  },
  piezas: [
    {
      nombre: { type: String, required: true },
      sku: { type: String, default: '' },
      excluida: { type: Boolean, default: false }
    }
  ],
  aceite: {
    marca: { type: String, default: '' },
    viscosidad: { type: String, default: '' },
    tecnologia: { type: String, default: '' },
    presentacion: { type: String, default: '' },
    litros: { type: Number, default: 4 }
  },
  estatus: {
    type: String,
    enum: ['Pendiente', 'Atendida', 'Cancelada', 'Pagado / Listo para surtir'],
    default: 'Pendiente'
  },
  servicioTaller: {
    type: String,
    enum: ['ninguno', 'basico', 'medio', 'completo'],
    default: 'ninguno'
  },
  metodoPago: {
    type: String,
    default: ''
  },
  detallesPago: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  direccionEnvio: {
    type: Object,
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cotizacion', CotizacionSchema);

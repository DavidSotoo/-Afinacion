const mongoose = require('mongoose');

const BujiaSchema = new mongoose.Schema({
  tipo: String,
  codigo: String
}, { _id: false });

const FiltroSchema = new mongoose.Schema({
  tipo: String,
  sku: String,
  marca: String,
  hasData: Boolean
}, { _id: false });

const KitAfinacionSchema = new mongoose.Schema({
  filtro_aceite: FiltroSchema,
  filtro_aire: FiltroSchema,
  filtro_gasolina: FiltroSchema,
  filtro_cabina: FiltroSchema
}, { _id: false });

const VehiculoSchema = new mongoose.Schema({
  marca: { type: String, required: true, index: true },
  modelo: { type: String, required: true, index: true },
  anio_inicio: { type: Number, required: true },
  anio_fin: { type: Number, required: true },
  motor: String,
  litros: Number,
  cilindros_config: String,
  aspiracion: String,
  
  bujia_stock: BujiaSchema,
  bujia_iridium_ix: BujiaSchema,
  bujia_g_power: BujiaSchema,
  bujia_v_power: BujiaSchema,
  calibracion_mm: Number,

  // El kit_afinacion ya vendrá precalculado desde el seed script
  kit_afinacion: KitAfinacionSchema

}, { timestamps: true });

// Ensure virtual fields (like id) are serialized
VehiculoSchema.set('toJSON', { virtuals: true });
VehiculoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehiculo', VehiculoSchema);

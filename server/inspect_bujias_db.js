require('dotenv').config();
const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Marcas únicas en la DB
  const marcas = await Vehiculo.distinct('marca');
  console.log('=== MARCAS EN DB ===');
  console.log(marcas.sort().join(', '));

  const total = await Vehiculo.countDocuments();
  console.log('\nTotal vehículos:', total);

  // Por marca: cuántos tienen bujia_stock, iridium, g_power, v_power
  for (const marca of marcas.sort()) {
    const veh = await Vehiculo.findOne({ marca: new RegExp(marca, 'i'), 'bujia_stock.tipo': { $exists: true } });
    if (veh) {
      console.log(`\n=== ${marca.toUpperCase()} — ejemplo: ${veh.modelo} ${veh.anio_inicio} ===`);
      console.log('  stock:    ', veh.bujia_stock?.tipo || '–');
      console.log('  iridium:  ', veh.bujia_iridium_ix?.tipo || '–');
      console.log('  g_power:  ', veh.bujia_g_power?.tipo || '–');
      console.log('  v_power:  ', veh.bujia_v_power?.tipo || '–');
    }
  }

  // Conteos por tipo de bujia
  const conStock    = await Vehiculo.countDocuments({ 'bujia_stock.tipo': { $exists: true } });
  const conIridium  = await Vehiculo.countDocuments({ 'bujia_iridium_ix.tipo': { $exists: true } });
  const conGPower   = await Vehiculo.countDocuments({ 'bujia_g_power.tipo': { $exists: true } });
  const conVPower   = await Vehiculo.countDocuments({ 'bujia_v_power.tipo': { $exists: true } });
  console.log('\n=== COBERTURA DE BUJIAS ===');
  console.log('Stock (OEM):  ', conStock);
  console.log('Iridium IX:   ', conIridium);
  console.log('G-Power:      ', conGPower);
  console.log('V-Power:      ', conVPower);

  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });

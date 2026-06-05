const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // 1. Motores 1.6L (Vento / CrossFox)
  const vento = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /vento/i,
    litros: 1.6
  }).lean();
  const crossfox = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /crossfox/i,
    litros: 1.6
  }).lean();

  // 2. Motores 1.4L TSI (Jetta A7 / Golf 1.4L TSI)
  const jetta14 = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /jetta/i,
    litros: 1.4,
    aspiracion: 'T'
  }).lean();
  const golf14 = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /golf/i,
    litros: 1.4,
    aspiracion: 'T'
  }).lean();

  // 3. Motores 2.0L Turbo (Golf GTI / Jetta GLI Gen 3)
  const gti = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /golf/i,
    litros: 2.0,
    aspiracion: 'T'
  }).lean();
  const gli = await Vehiculo.findOne({
    marca: /volkswagen/i,
    modelo: /jetta/i,
    litros: 2.0,
    aspiracion: 'T'
  }).lean();

  console.log('--- VW VENTO 1.6L ---');
  if (vento) console.log(JSON.stringify({ modelo: vento.modelo, litros: vento.litros, motor: vento.motor, kit_afinacion: vento.kit_afinacion, filtros_unifil: vento.filtros_unifil, referencias_alternas: vento.referencias_alternas }, null, 2));
  else console.log('Vento 1.6L not found');

  console.log('--- VW CROSSFOX 1.6L ---');
  if (crossfox) console.log(JSON.stringify({ modelo: crossfox.modelo, litros: crossfox.litros, motor: crossfox.motor, kit_afinacion: crossfox.kit_afinacion, filtros_unifil: crossfox.filtros_unifil, referencias_alternas: crossfox.referencias_alternas }, null, 2));
  else console.log('CrossFox 1.6L not found');

  console.log('--- VW JETTA 1.4L TSI ---');
  if (jetta14) console.log(JSON.stringify({ modelo: jetta14.modelo, litros: jetta14.litros, motor: jetta14.motor, kit_afinacion: jetta14.kit_afinacion, filtros_unifil: jetta14.filtros_unifil, referencias_alternas: jetta14.referencias_alternas }, null, 2));
  else console.log('Jetta 1.4L TSI not found');

  console.log('--- VW GOLF 1.4L TSI ---');
  if (golf14) console.log(JSON.stringify({ modelo: golf14.modelo, litros: golf14.litros, motor: golf14.motor, kit_afinacion: golf14.kit_afinacion, filtros_unifil: golf14.filtros_unifil, referencias_alternas: golf14.referencias_alternas }, null, 2));
  else console.log('Golf 1.4L TSI not found');

  console.log('--- VW GOLF GTI 2.0L T ---');
  if (gti) console.log(JSON.stringify({ modelo: gti.modelo, litros: gti.litros, motor: gti.motor, kit_afinacion: gti.kit_afinacion, filtros_unifil: gti.filtros_unifil, referencias_alternas: gti.referencias_alternas }, null, 2));
  else console.log('Golf GTI 2.0L T not found');

  console.log('--- VW JETTA GLI 2.0L T ---');
  if (gli) console.log(JSON.stringify({ modelo: gli.modelo, litros: gli.litros, motor: gli.motor, kit_afinacion: gli.kit_afinacion, filtros_unifil: gli.filtros_unifil, referencias_alternas: gli.referencias_alternas }, null, 2));
  else console.log('Jetta GLI 2.0L T not found');

  await mongoose.disconnect();
}

main();

const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');
const { enrichVehiculosWithPrices } = require('./lib/pricingHelpers');

mongoose.connect("mongodb+srv://taskflowUser:REDACTED_PASSWORD@cluster0.adtp9yw.mongodb.net/?appName=Cluster0")
  .then(async () => {
    const v = await Vehiculo.findOne({ modelo: /A3/i });
    if (v) {
      const enriched = await enrichVehiculosWithPrices([v]);
      console.log("VEHICLE FOUND:", v.marca, v.modelo, v._id);
      console.log("KIT AFINACION DATA:", JSON.stringify(enriched[0].kit_afinacion, null, 2));
    } else {
      console.log("NO AUDI A3 FOUND IN DB");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

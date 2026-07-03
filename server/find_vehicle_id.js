const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://taskflowUser:REDACTED_PASSWORD@cluster0.adtp9yw.mongodb.net/?appName=Cluster0")
  .then(async () => {
    const v = await Vehiculo.findOne({ kit_afinacion: { $ne: null } });
    if (v) {
      console.log("VEHICLE FOUND:", JSON.stringify({ id: v._id.toString(), marca: v.marca, modelo: v.modelo, anio_inicio: v.anio_inicio, anio_fin: v.anio_fin }));
    } else {
      const v2 = await Vehiculo.findOne({});
      console.log("VEHICLE (ANY) FOUND:", v2 ? JSON.stringify({ id: v2._id.toString(), marca: v2.marca, modelo: v2.modelo }) : "NONE");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

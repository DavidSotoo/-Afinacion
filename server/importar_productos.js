require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const Producto = require('./models/Producto');

async function importarCSV() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Falta definir MONGO_URI en las variables de entorno (.env)");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Conectado a MongoDB Atlas.');

    const operaciones = [];
    const csvPath = 'Lista de precios.csv';

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ No se encontró el archivo CSV en la ruta: ${csvPath}`);
      process.exit(1);
    }

    fs.createReadStream(csvPath)
      // Normalizamos los encabezados quitando espacios en blanco (ej. ' Costo ' pasa a ser 'Costo')
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        // Detectar columnas en base a la estructura real del archivo (SKU, Descripción, Costo)
        const sku = row.SKU || row.sku || row.Codigo || row.codigo;
        const nombre = row.Descripción || row.Descripcion || row.Nombre || row.nombre || row.descripcion;
        const precioListaRaw = row['Costo'] || row['Costo +IVA'] || row.Precio_Lista || row.precio_lista || row.Precio || row.precio;
        const marca = row.Marca || row.marca || 'NGK';

        if (sku && nombre && precioListaRaw != null) {
          // Limpiamos signos de dólar ($) y espacios antes de parsear a número flotante
          const precioLimpio = precioListaRaw.toString().replace(/[^0-9.]/g, '');
          const precioLista = parseFloat(precioLimpio) || 0;

          operaciones.push({
            updateOne: {
              filter: { sku: sku.trim() },
              update: {
                $set: {
                  sku: sku.trim(),
                  nombre: nombre.trim(),
                  precioLista: precioLista,
                  marca: marca
                }
              },
              upsert: true
            }
          });
        }
      })
      .on('end', async () => {
        console.log(` Procesando ${operaciones.length} productos para importar/actualizar en MongoDB...`);
        if (operaciones.length > 0) {
          const resultado = await Producto.bulkWrite(operaciones);
          console.log(` ¡Importación exitosa! Insertados: ${resultado.upsertedCount}, Actualizados: ${resultado.modifiedCount}`);
        } else {
          console.log(' No se encontraron filas válidas para importar.');
        }
        await mongoose.connection.close();
        process.exit(0);
      });
  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    process.exit(1);
  }
}

importarCSV();

require('dotenv').config();
const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB Atlas para el chequeo.');

    const vehiculos = await Vehiculo.find({});
    console.log(`Total de vehículos en DB: ${vehiculos.length}\n`);

    // Agrupar por marca
    const stats = {};

    for (const v of vehiculos) {
      const marca = v.marca.toUpperCase();
      if (!stats[marca]) {
        stats[marca] = {
          total: 0,
          conFiltros: 0,
          sinFiltros: 0,
          ejemplosSinFiltros: []
        };
      }

      stats[marca].total++;

      // Verificar si tiene al menos un filtro con SKU o con hasData === true
      const kit = v.kit_afinacion || {};
      const tieneAceite = kit.filtro_aceite && kit.filtro_aceite.sku && kit.filtro_aceite.sku !== 'SELLADO';
      const tieneAire = kit.filtro_aire && kit.filtro_aire.sku;
      const tieneGasolina = kit.filtro_gasolina && kit.filtro_gasolina.sku && kit.filtro_gasolina.sku !== 'SELLADO';
      const tieneCabina = kit.filtro_cabina && kit.filtro_cabina.sku;

      const tieneAlgunaData = tieneAceite || tieneAire || tieneGasolina || tieneCabina;

      if (tieneAlgunaData) {
        stats[marca].conFiltros++;
      } else {
        stats[marca].sinFiltros++;
        if (stats[marca].ejemplosSinFiltros.length < 5) {
          stats[marca].ejemplosSinFiltros.push({
            modelo: v.modelo,
            motor: v.motor,
            litros: v.litros,
            anio: `${v.anio_inicio}-${v.anio_fin}`
          });
        }
      }
    }

    console.log('=== ESTADÍSTICAS DE FILTROS POR MARCA ===');
    for (const [marca, data] of Object.entries(stats)) {
      const porcentaje = ((data.conFiltros / data.total) * 100).toFixed(1);
      console.log(`\nMarca: ${marca}`);
      console.log(`  Total vehículos en catálogo NGK: ${data.total}`);
      console.log(`  Con filtros reales Interfil:   ${data.conFiltros} (${porcentaje}%)`);
      console.log(`  Sin filtros asignados:         ${data.sinFiltros}`);
      if (data.sinFiltros > 0) {
        console.log(`  Ejemplos de modelos sin filtros:`);
        data.ejemplosSinFiltros.forEach(ej => {
          console.log(`    - ${ej.modelo} ${ej.litros}L (${ej.motor}) [Años: ${ej.anio}]`);
        });
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB.');
  }
}

main();

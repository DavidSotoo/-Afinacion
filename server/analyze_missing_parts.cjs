const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const Vehiculo = require('./models/Vehiculo.js');

async function analyze() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const vehiculos = await Vehiculo.find({});
    console.log(`Total vehicles found: ${vehiculos.length}`);

    const missingStats = {
      total: vehiculos.length,
      missingAnyBujia: 0,
      missingAllBujias: 0,
      missingFiltroAceite: 0,
      missingFiltroAire: 0,
      missingFiltroGasolina: 0,
      missingFiltroCabina: 0,
      missingAllFiltros: 0,
      missingEverything: 0,
    };

    const groupedByMarca = {};

    vehiculos.forEach(v => {
      const { marca, modelo, anio_inicio, anio_fin, motor } = v;
      const vName = `${marca} ${modelo} ${anio_inicio}-${anio_fin} ${motor || ''}`.trim();

      if (!groupedByMarca[marca]) {
        groupedByMarca[marca] = {
          total: 0,
          missingAllBujias: [],
          missingFiltroAceite: [],
          missingFiltroAire: [],
          missingFiltroGasolina: [],
          missingFiltroCabina: []
        };
      }

      groupedByMarca[marca].total++;

      // Check bujias
      const hasStock = v.bujia_stock && v.bujia_stock.codigo;
      const hasIridium = v.bujia_iridium_ix && v.bujia_iridium_ix.codigo;
      const hasGPower = v.bujia_g_power && v.bujia_g_power.codigo;
      const hasVPower = v.bujia_v_power && v.bujia_v_power.codigo;

      const hasAnyBujia = hasStock || hasIridium || hasGPower || hasVPower;

      if (!hasAnyBujia) {
        missingStats.missingAllBujias++;
        groupedByMarca[marca].missingAllBujias.push(vName);
      }

      // Check filters
      const kit = v.kit_afinacion || {};
      const hasAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const hasAire = kit.filtro_aire && kit.filtro_aire.sku;
      const hasGasolina = kit.filtro_gasolina && kit.filtro_gasolina.sku;
      const hasCabina = kit.filtro_cabina && kit.filtro_cabina.sku;

      if (!hasAceite) {
        missingStats.missingFiltroAceite++;
        groupedByMarca[marca].missingFiltroAceite.push(vName);
      }
      if (!hasAire) {
        missingStats.missingFiltroAire++;
        groupedByMarca[marca].missingFiltroAire.push(vName);
      }
      if (!hasGasolina) {
        missingStats.missingFiltroGasolina++;
        groupedByMarca[marca].missingFiltroGasolina.push(vName);
      }
      if (!hasCabina) {
        missingStats.missingFiltroCabina++;
        groupedByMarca[marca].missingFiltroCabina.push(vName);
      }

      const hasAnyFiltro = hasAceite || hasAire || hasGasolina || hasCabina;
      if (!hasAnyFiltro) {
        missingStats.missingAllFiltros++;
      }

      if (!hasAnyBujia && !hasAnyFiltro) {
        missingStats.missingEverything++;
      }
    });

    let markdown = `# Análisis de Vehículos con Partes Faltantes\n\n`;
    markdown += `## Resumen Global\n`;
    markdown += `- Total de vehículos: **${missingStats.total}**\n`;
    markdown += `- Vehículos sin NINGUNA bujía: **${missingStats.missingAllBujias}** (${((missingStats.missingAllBujias / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin filtro de aceite: **${missingStats.missingFiltroAceite}** (${((missingStats.missingFiltroAceite / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin filtro de aire: **${missingStats.missingFiltroAire}** (${((missingStats.missingFiltroAire / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin filtro de gasolina: **${missingStats.missingFiltroGasolina}** (${((missingStats.missingFiltroGasolina / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin filtro de cabina: **${missingStats.missingFiltroCabina}** (${((missingStats.missingFiltroCabina / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin NINGÚN filtro: **${missingStats.missingAllFiltros}** (${((missingStats.missingAllFiltros / missingStats.total) * 100).toFixed(2)}%)\n`;
    markdown += `- Vehículos sin NADA (ni bujías ni filtros): **${missingStats.missingEverything}** (${((missingStats.missingEverything / missingStats.total) * 100).toFixed(2)}%)\n\n`;

    markdown += `## Desglose por Marca\n\n`;

    for (const marca of Object.keys(groupedByMarca).sort()) {
      const data = groupedByMarca[marca];
      markdown += `### ${marca} (Total: ${data.total})\n`;
      
      const formatList = (title, items) => {
        if (items.length === 0) return '';
        const display = items.slice(0, 10);
        const extra = items.length > 10 ? `...y ${items.length - 10} más` : '';
        let res = `**${title} (${items.length}):**\n`;
        display.forEach(i => res += `- ${i}\n`);
        if (extra) res += `- *${extra}*\n`;
        return res + '\n';
      };

      markdown += formatList('Faltan TODAS las Bujías', data.missingAllBujias);
      markdown += formatList('Falta Filtro de Aceite', data.missingFiltroAceite);
      markdown += formatList('Falta Filtro de Aire', data.missingFiltroAire);
      markdown += formatList('Falta Filtro de Gasolina', data.missingFiltroGasolina);
      markdown += formatList('Falta Filtro de Cabina', data.missingFiltroCabina);
      markdown += `---\n\n`;
    }

    // Save to artifact directory
    const artifactsDir = process.env.APPDATA_DIR || 'c:/Users/david/.gemini/antigravity-ide/brain/5de4bc32-5c81-47ea-81c1-d48de9b86b99';
    fs.writeFileSync(artifactsDir + '/missing_parts_report.md', markdown);
    console.log('Report saved to missing_parts_report.md');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

analyze();

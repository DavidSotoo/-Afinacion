const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');
  const unifilPath = path.join(__dirname, '../public/data/nissan_unifil_filtros.json');
  const joePath = path.join(__dirname, '../public/data/nissan_filtros_aire_JOE.json');

  const missing = [
    { model: '200SX', litros: 1.6, motor: 'GA16DE', anios: '1995-1998' },
    { model: '240SX', litros: 2.4, motor: 'KA24DE', anios: '1993-2000' },
    { model: '300ZX', litros: 3.0, motor: 'VG30DE', anios: '1991-1996' },
    { model: '300ZX', litros: 3.0, motor: 'VG30DETT', anios: '1995-1996' },
    { model: '370Z Nismo', litros: 3.7, motor: 'VQ37VHR', anios: '2018-2020' },
    { model: 'Kicks e-POWER', litros: 1.2, motor: 'HR12DE', anios: '2023-2023' },
    { model: 'Pathfinder', litros: 3.5, motor: 'VQ35DD', anios: '2023-2024' },
    { model: 'Tsuru', litros: 1.6, motor: 'GA16DNE', anios: '1995-2017' },
    { model: 'Tsuru', litros: 2.0, motor: 'GSR2000', anios: '1997-2001' },
    { model: 'Z', litros: 3.0, motor: 'VR30DDTT', anios: '2023-2023' }
  ];

  console.log('=== SEARCHING PDF FOR NISSAN MISSING MODELS ===\n');
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  
  // Parse pages 55 to 65
  const result = await parser.getText({ first: 55, last: 65 });
  result.pages.forEach((p, idx) => {
    const lines = p.text.split('\n');
    lines.forEach(line => {
      const u = line.toUpperCase();
      if (u.includes('TSURU') || u.includes('200SX') || u.includes('240SX') || u.includes('300ZX') || u.includes('370Z') || u.includes('PATHFINDER') || u.includes('KICKS') || u.includes(' Z ')) {
        console.log(`[PDF P${idx+55}] ${line.trim()}`);
      }
    });
  });

  console.log('\n=== SEARCHING UNIFIL JSON ===');
  if (fs.existsSync(unifilPath)) {
    const unifil = JSON.parse(fs.readFileSync(unifilPath, 'utf8'));
    unifil.forEach(item => {
      const str = JSON.stringify(item).toUpperCase();
      if (str.includes('TSURU') || str.includes('200SX') || str.includes('240SX') || str.includes('300ZX') || str.includes('370Z') || str.includes('PATHFINDER') || str.includes('KICKS') || str.includes('Z')) {
        console.log(`[UNIFIL]`, item);
      }
    });
  }

  console.log('\n=== SEARCHING JOE JSON ===');
  if (fs.existsSync(joePath)) {
    const joe = JSON.parse(fs.readFileSync(joePath, 'utf8'));
    joe.forEach(item => {
      const str = JSON.stringify(item).toUpperCase();
      if (str.includes('TSURU') || str.includes('200SX') || str.includes('240SX') || str.includes('300ZX') || str.includes('370Z') || str.includes('PATHFINDER') || str.includes('KICKS') || str.includes('Z')) {
        console.log(`[JOE]`, item);
      }
    });
  }
}

main();

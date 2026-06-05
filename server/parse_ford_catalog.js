const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading PDF:', err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  // Ford is pages 41 to 46
  parser.getText({ first: 41, last: 46 }).then(function(result) {
    const parsedRows = [];
    
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const tokens = trimmed.split(/[\s\t]+/);
        const yearIndex = tokens.findIndex(t => /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(t));
        if (yearIndex === -1) return;
        
        const model = tokens.slice(0, yearIndex).join(' ').toUpperCase().trim();
        const yearToken = tokens[yearIndex];
        
        let anio_inicio = 0;
        let anio_fin = 0;
        if (yearToken.includes('-')) {
          const parts = yearToken.split('-');
          anio_inicio = parseInt(parts[0], 10);
          anio_fin = parseInt(parts[1], 10);
        } else {
          anio_inicio = parseInt(yearToken, 10);
          anio_fin = anio_inicio;
        }
        
        const restTokens = tokens.slice(yearIndex + 1);
        
        // Extract cylinders
        let cilindros = '';
        const cylIndex = restTokens.findIndex(t => /^(L[3456]|V[68]|EV\/BEV|V10)$/i.test(t));
        if (cylIndex !== -1) {
          cilindros = restTokens[cylIndex].toUpperCase();
        }
        
        // Extract displacement (liters)
        let litros = null;
        const litToken = restTokens.find(t => /^\d+(\.\d+)?L?$/i.test(t) && !/^(19|20)\d{2}$/.test(t) && !/^\d+$/.test(t));
        if (litToken) {
          litros = parseFloat(litToken.replace(/L/i, ''));
        } else {
          // If no L-suffix, look for numbers like 5.7 or 4.6 or 3.0
          const numToken = restTokens.find(t => /^\d+\.\d+$/.test(t));
          if (numToken) {
            litros = parseFloat(numToken);
          }
        }
        
        // Extract filters
        let aceite = null;
        let aire = null;
        let cabina = null;
        let gasolina = null;
        
        restTokens.forEach(t => {
          let cleanToken = t.trim();
          
          if (/^(FO|OF)-\w+/i.test(cleanToken)) {
            cleanToken = cleanToken.replace(/^OF-/i, 'FO-').replace(/\(\w+/g, '');
            aceite = cleanToken;
          } else if (/^FA-\w+/i.test(cleanToken)) {
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            aire = cleanToken;
          } else if (/^(FC|F)-\w+/i.test(cleanToken)) {
            if (cleanToken.startsWith('F-') || cleanToken.startsWith('f-')) {
              cleanToken = 'FC-' + cleanToken.substring(2);
            }
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            cabina = cleanToken;
          } else if (/^(FG|FD)-\w+/i.test(cleanToken)) {
            if (cleanToken.startsWith('FD-') || cleanToken.startsWith('fd-')) {
              cleanToken = 'FG-' + cleanToken.substring(3);
            }
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            gasolina = cleanToken;
          }
        });
        
        parsedRows.push({
          model,
          anio_inicio,
          anio_fin,
          cilindros,
          litros,
          filters: { aceite, aire, cabina, gasolina },
          rawLine: trimmed
        });
      });
    });
    
    console.log(`Successfully parsed ${parsedRows.length} Ford rows.`);
    console.log('\n--- SAMPLE PARSED FORD ROWS (FIRST 30) ---');
    console.log(JSON.stringify(parsedRows.slice(0, 30), null, 2));
    
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

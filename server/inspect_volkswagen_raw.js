const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 73, last: 79 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 73;
      console.log(`=== VOLKSWAGEN PAGE ${pageNum} ===`);
      const lines = page.text.split('\n');
      lines.forEach(line => {
        const upper = line.toUpperCase();
        if (upper.includes('DERBY') || upper.includes('LUPO') || upper.includes('EUROVAN') || 
            upper.includes('CROSS') || upper.includes('CADDY') || upper.includes('TERAMONT') || 
            upper.includes('COMBI') || upper.includes('PANEL') || upper.includes('VAN')) {
          console.log(`[P${pageNum}] ${line.trim()}`);
        }
      });
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

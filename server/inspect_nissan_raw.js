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
  
  parser.getText({ first: 60, last: 63 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 60;
      console.log(`=== NISSAN PAGE ${pageNum} ===`);
      const lines = page.text.split('\n');
      lines.forEach(line => {
        const upper = line.toUpperCase();
        if (upper.includes('TSURU') || upper.includes('TIIDA') || upper.includes('SENTRA') || 
            upper.includes('ALMERA') || upper.includes('370Z') || upper.includes('300ZX') || 
            upper.includes('240SX') || upper.includes('200SX') || upper.includes('PATHFINDER') ||
            upper.includes('KICKS') || upper.includes('Z ')) {
          console.log(`[P${pageNum}] ${line.trim()}`);
        }
      });
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

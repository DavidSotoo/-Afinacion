const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error(err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 55, last: 56 }).then(function(result) {
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        const tokens = trimmed.split(/[\s\t]+/);
        const yearIndex = tokens.findIndex(t => /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(t));
        if (yearIndex === -1) return;
        
        const model = tokens.slice(0, yearIndex).join(' ').toUpperCase().trim();
        if (model === '3' || model === '3 SPORT') {
          console.log(`Page ${p.num}: "${trimmed}"`);
        }
      });
    });
  }).catch(err => {
    console.error(err);
  });
});

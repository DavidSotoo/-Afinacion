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
  
  parser.getText({ first: 19, last: 33 }).then(function(result) {
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('sellad') || lower.includes('tank') || lower.includes('in-')) {
          console.log(`Page ${p.num}: "${line}"`);
        }
      });
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

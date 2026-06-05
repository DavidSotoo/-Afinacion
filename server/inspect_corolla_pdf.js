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
  
  parser.getText({ first: 70, last: 73 }).then(function(result) {
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        if (line.toUpperCase().includes('COROLLA')) {
          console.log(`Page ${p.num}: "${line.trim()}"`);
        }
      });
    });
  }).catch(err => {
    console.error(err);
  });
});

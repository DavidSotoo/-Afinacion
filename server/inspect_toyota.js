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
  
  parser.getText({ first: 61, last: 90 }).then(function(result) {
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      console.log(`Page ${p.num}: ${lines.slice(0, 8).join(' | ')}`);
    });
  }).catch(err => {
    console.error(err);
  });
});

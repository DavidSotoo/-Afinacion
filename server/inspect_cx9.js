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
  
  parser.getText({ first: 55, last: 56 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 55;
      const lines = page.text.split('\n');
      lines.forEach(line => {
        if (line.toUpperCase().includes('CX-9') || line.toUpperCase().includes('10547')) {
          console.log(`[P${pageNum}] ${line.trim()}`);
        }
      });
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

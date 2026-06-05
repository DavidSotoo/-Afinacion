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
  
  parser.getText({ first: 55, last: 55 }).then(function(result) {
    const lines = result.pages[0].text.split('\n');
    lines.forEach(line => {
      if (line.toUpperCase().includes('MAZDA 3') || line.toUpperCase().includes('3 ') || line.toUpperCase().includes('127')) {
        console.log(line.trim());
      }
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

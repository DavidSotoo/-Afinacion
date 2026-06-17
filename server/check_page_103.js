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
  
  parser.getText({ first: 103, last: 103 }).then(function(result) {
    console.log(result.pages[0].text);
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

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
  
  parser.getText({ first: 1, last: 10 }).then(function(result) {
    result.pages.forEach((page, index) => {
      console.log(`--- PAGE ${index + 1} ---`);
      console.log(page.text.substring(0, 1500)); // Print first 1500 chars of each page
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

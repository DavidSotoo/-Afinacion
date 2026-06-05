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
  
  parser.getText({ first: 60, last: 62 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 60;
      console.log(`=== NISSAN PAGE ${pageNum} ===`);
      console.log(page.text);
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

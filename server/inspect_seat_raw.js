const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/11021_Catalogo Master 2025 1ra Edicion.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  console.log('Reading pages 78 to 79 of NGK Catalog...');
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 78, last: 79 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 78;
      console.log(`=== SEAT PAGE ${pageNum} ===`);
      console.log(page.text);
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

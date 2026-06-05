const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/CATALOGO-FILTRO-DE-AIRE-JOE-enero-26-c.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  console.log('Dumping pages 101 to 103 of JOE Catalog...');
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 101, last: 103 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 101;
      console.log(`=== JOE PAGE ${pageNum} ===`);
      console.log(page.text);
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

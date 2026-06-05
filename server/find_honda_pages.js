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
  
  parser.getText().then(function(result) {
    const accordPages = [];
    const civicPages = [];
    
    result.pages.forEach(p => {
      const upper = p.text.toUpperCase();
      if (upper.includes('ACCORD')) accordPages.push(p.num);
      if (upper.includes('CIVIC')) civicPages.push(p.num);
    });
    
    console.log('Accord found on pages:', accordPages);
    console.log('Civic found on pages:', civicPages);
  }).catch(err => {
    console.error(err);
  });
});

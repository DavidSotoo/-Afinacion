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
  
  parser.getText({ first: 1, last: 150 }).then(function(result) {
    console.log(`Total pages parsed: ${result.pages.length}`);
    
    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const text = page.text;
      if (text.toUpperCase().includes('BMW')) {
        console.log(`Page ${pageNum} contains 'BMW'. First 150 chars:`);
        console.log(text.substring(0, 150).replace(/\n/g, ' '));
        console.log('----------------------------------------------------');
      }
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

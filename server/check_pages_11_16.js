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
  
  parser.getText({ first: 11, last: 16 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 11;
      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      console.log(`\n================ Page ${pageNum} (First 10 lines) ================`);
      lines.slice(0, 10).forEach(l => console.log(l));
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

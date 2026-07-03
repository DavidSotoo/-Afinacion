const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/catalogo-wagner-2022-2023.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 12, last: 13 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 12;
      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      console.log(`\n================ Page ${pageNum} ================`);
      lines.slice(0, 30).forEach(l => console.log(l));
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

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
    let found = false;
    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const lines = page.text.split('\n');
      lines.forEach((line, lineIdx) => {
        if (line.toUpperCase().includes('TSURU')) {
          console.log(`Found on Page ${pageNum}, line ${lineIdx + 1}: "${line.trim()}"`);
          found = true;
        }
      });
    });
    if (!found) {
      console.log('Word "TSURU" NOT found anywhere in the PDF catalog.');
    }
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

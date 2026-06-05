const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/CATALOGO-FILTRO-DE-AIRE-JOE-enero-26-c.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  console.log('Searching in JOE Catalog PDF...');
  const parser = new PDFParse({ data: dataBuffer });
  
  // Parse pages 1 to 200 (or adjust max pages if needed)
  parser.getText({ first: 1, last: 200 }).then(function(result) {
    console.log(`Total pages: ${result.pages.length}`);
    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const text = page.text;
      if (text.toUpperCase().includes('SEAT')) {
        console.log(`=== Found SEAT on Page ${pageNum} ===`);
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.toUpperCase().includes('SEAT') || line.toUpperCase().includes('IBIZA') || line.toUpperCase().includes('LEON') || line.toUpperCase().includes('TOLEDO') || line.toUpperCase().includes('ARONA') || line.toUpperCase().includes('ATECA')) {
            console.log(`  [P${pageNum}] ${line.trim()}`);
          }
        });
      }
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

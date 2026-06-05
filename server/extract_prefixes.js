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
  
  parser.getText({ first: 19, last: 33 }).then(function(result) {
    const codes = new Set();
    const prefixes = new Set();
    
    result.pages.forEach(p => {
      const tokens = p.text.split(/[\s\t]+/);
      tokens.forEach(t => {
        // Filter codes usually have a hyphen like FA-8755 or FO-3506 or F-10775/CA or FG-19
        if (t.includes('-')) {
          codes.add(t);
          const match = t.match(/^([A-Z]+)-/);
          if (match) {
            prefixes.add(match[1]);
          } else {
            // Check for codes like F-10775
            const singleMatch = t.match(/^([A-Z])-([0-9]+)/);
            if (singleMatch) {
              prefixes.add(singleMatch[1]);
            }
          }
        }
      });
    });
    
    console.log('Detected Prefixes:', Array.from(prefixes));
    console.log('Sample codes found:', Array.from(codes).slice(0, 50));
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

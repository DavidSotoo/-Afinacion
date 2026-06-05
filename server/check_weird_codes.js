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
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const tokens = line.split(/[\s\t]+/);
        tokens.forEach(t => {
          if (t.includes('-')) {
            const hasWeirdPrefix = /^(F|FD|OF)-/.test(t) && !/^(FA|FO|FC|FG)-/.test(t);
            if (hasWeirdPrefix) {
              console.log(`Page ${p.num} line: "${line}"`);
              console.log(`  Weird token: "${t}"`);
            }
          }
        });
      });
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

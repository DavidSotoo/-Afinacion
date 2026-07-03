const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/catalogo-wagner-2022-2023.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 12, last: 13 }).then(function(result) {
    const fmsiRegex = /\b(\d{4,5}[A-Z]?-D\d{3,4}[A-Z]?|-[A-Z0-9]{4,5})\b/g;
    const wagnerRegex = /\b(W[CDX]\d{2,6}[A-Z]?(\(\d+\))?|OEX\d{4}[A-Z]?)\b/g;

    let currentModel = '';

    result.pages.forEach((page, index) => {
      const pageNum = index + 12;
      console.log(`\n--- PAGE ${pageNum} ---`);
      
      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      
      lines.forEach(line => {
        // Detect model headers: lines that don't have years and are short, like "A1", "A3", etc.
        // Wait, "Audi" or "Audi (Cont.)" are brand headers
        if (line.startsWith('Audi') || line.includes('Formulaciones:') || line.includes('Alfa Romeo')) {
          return;
        }

        const yearMatch = line.match(/^(\d{4})\s+(\d{4})\b/);
        if (yearMatch) {
          const startYear = parseInt(yearMatch[1], 10);
          const endYear = parseInt(yearMatch[2], 10);
          
          const fmsis = line.match(fmsiRegex) || [];
          const wagners = line.match(wagnerRegex) || [];
          
          console.log(`Model: ${currentModel} | Years: ${startYear}-${endYear} | FMSIs: [${fmsis.join(', ')}] | Wagners: [${wagners.join(', ')}] | Line: ${line}`);
        } else {
          // If it doesn't start with a year and is a short line, it might be a model header
          if (line.length < 30 && !/\d{4}/.test(line) && !line.includes('Espesor') && !line.includes('Diámetro')) {
            currentModel = line;
            console.log(`Detected Model Header: ${currentModel}`);
          }
        }
      });
    });
  });
});

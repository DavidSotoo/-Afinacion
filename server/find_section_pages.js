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
  
  parser.getText({ first: 5, last: 80 }).then(function(result) {
    result.pages.forEach((page, index) => {
      const pageNum = index + 5;
      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      
      // Let's look for brand names at the beginning of the text or lines that represent a brand name change
      const brandsOnPage = new Set();
      lines.forEach(line => {
        const word = line.toUpperCase();
        if (['AUDI', 'BMW', 'CHEVROLET', 'CHRYSLER', 'DODGE', 'FIAT', 'FORD', 'HONDA', 'HYUNDAI', 'ISUZU', 'JEEP', 'KIA', 'MAZDA', 'MITSUBISHI', 'NISSAN', 'PEUGEOT', 'RENAULT', 'SEAT', 'SUZUKI', 'TOYOTA', 'VOLKSWAGEN', 'VOLVO'].includes(word)) {
          brandsOnPage.add(word);
        }
      });
      
      console.log(`Page ${pageNum}: brands found: ${Array.from(brandsOnPage).join(', ')} | First line: "${lines[0]}"`);
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

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
  
  // We don't know the exact number of pages, so let's parse a large range (e.g. 1 to 150)
  parser.getText({ first: 1, last: 150 }).then(function(result) {
    console.log(`Total pages parsed: ${result.pages.length}`);
    
    // We want to detect brand headers. Usually a brand name appears on lines right before its model listing.
    // Let's print the first few non-header lines of each page to see what brands are active.
    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      
      // Let's filter out common headers like "Catálogo", "UNIFIL", "Modelo", "Año", "Marcas de vehiculo"
      const contentLines = lines.filter(l => {
        return !l.includes('Catálogo') && 
               !l.includes('UNIFIL') && 
               !l.includes('Modelo') && 
               !l.includes('Año') && 
               !l.includes('No.Cil') && 
               !l.includes('Marcas de vehiculo') && 
               !l.includes('2025');
      });
      
      console.log(`Page ${pageNum}: First 3 content lines:`, contentLines.slice(0, 3));
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

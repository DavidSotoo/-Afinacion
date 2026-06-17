const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/CATALOGO-FILTRO-DE-AIRE-JOE-enero-26-c.pdf');

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  const parser = new PDFParse({ data: dataBuffer });
  
  parser.getText({ first: 1, last: 150 }).then(function(result) {
    console.log(`Searching JOE Catalog (150 pages)...`);
    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const text = page.text.toLowerCase();
      if (text.includes('dodge') || text.includes('mitsubishi')) {
        console.log(`- Page ${pageNum} contains match:`);
        const lines = page.text.split('\n');
        const dodgeMatches = lines.filter(l => l.toLowerCase().includes('dodge')).slice(0, 2);
        const mitsMatches = lines.filter(l => l.toLowerCase().includes('mitsubishi')).slice(0, 2);
        if (dodgeMatches.length > 0) console.log(`  Dodge Lines:`, dodgeMatches);
        if (mitsMatches.length > 0) console.log(`  Mitsubishi Lines:`, mitsMatches);
      }
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

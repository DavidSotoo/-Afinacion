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
  
  // Parse pages 1 to 100 in one go, then save the pages we want
  parser.getText({ first: 1, last: 100 }).then(function(result) {
    const pagesToSave = [
      { num: 34, prefix: 'dodge_joe' },
      { num: 35, prefix: 'dodge_joe' },
      { num: 36, prefix: 'dodge_joe' },
      { num: 37, prefix: 'dodge_joe' },
      { num: 60, prefix: 'dodge_joe' },
      { num: 61, prefix: 'dodge_joe' },
      { num: 83, prefix: 'mitsubishi_joe' },
      { num: 84, prefix: 'mitsubishi_joe' },
      { num: 85, prefix: 'mitsubishi_joe' }
    ];
    
    pagesToSave.forEach(p => {
      // index is num - 1
      const pageData = result.pages[p.num - 1];
      if (pageData) {
        const outputPath = path.join(__dirname, `${p.prefix}_page_${p.num}.txt`);
        fs.writeFileSync(outputPath, pageData.text, 'utf8');
        console.log(`Saved ${p.prefix} page ${p.num} to ${outputPath}`);
      } else {
        console.warn(`Page ${p.num} not found in parsed result`);
      }
    });
  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

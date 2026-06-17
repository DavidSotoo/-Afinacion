const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/CATALOGO-FILTRO-DE-AIRE-JOE-enero-26-c.pdf');

function dumpPages(pagesList, prefix) {
  return new Promise((resolve) => {
    fs.readFile(pdfPath, (err, dataBuffer) => {
      if (err) {
        console.error('Error reading file:', err);
        resolve();
        return;
      }
      
      const parser = new PDFParse({ data: dataBuffer });
      
      const promises = pagesList.map(pageNum => {
        return parser.getText({ first: pageNum, last: pageNum }).then(result => {
          const outputPath = path.join(__dirname, `${prefix}_page_${pageNum}.txt`);
          fs.writeFileSync(outputPath, result.pages[0].text, 'utf8');
          console.log(`Saved ${prefix} page ${pageNum} to ${outputPath}`);
        });
      });
      
      Promise.all(promises).then(resolve).catch(err => {
        console.error('Error parsing:', err);
        resolve();
      });
    });
  });
}

async function main() {
  await dumpPages([34, 35, 36, 37, 60, 61], 'dodge_joe');
  await dumpPages([83, 84, 85], 'mitsubishi_joe');
}

main();

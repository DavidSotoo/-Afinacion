const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/data/catalogo-wagner-2022-2023.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error('PDF file does not exist at:', pdfPath);
  process.exit(1);
}

fs.readFile(pdfPath, (err, dataBuffer) => {
  if (err) {
    console.error('Error reading PDF:', err);
    return;
  }

  const parser = new PDFParse({ data: dataBuffer });
  
  // We check the first 250 pages to find headers
  parser.getText({ first: 1, last: 250 }).then(function(result) {
    console.log(`Total pages in Wagner catalog: ${result.pages.length}`);
    
    // Scan pages for brand section headers
    const brands = ['AUDI', 'BMW', 'DODGE', 'MITSUBISHI', 'SEAT'];
    const brandPages = {};
    brands.forEach(b => brandPages[b] = []);

    result.pages.forEach((page, index) => {
      const pageNum = index + 1;
      const text = page.text.toUpperCase();
      
      // Look for brand headers, usually isolated on a line or appearing frequently
      brands.forEach(b => {
        if (text.includes(b)) {
          // Check if it looks like a catalog page for that brand
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          // If the brand is mentioned multiple times or near year patterns
          const hasYears = lines.some(l => /\b(19|20)\d{2}\b/.test(l));
          if (hasYears) {
            brandPages[b].push(pageNum);
          }
        }
      });
    });

    console.log('\n=== Brand pages found in Wagner catalog (First 250 pages) ===');
    brands.forEach(b => {
      const pages = brandPages[b];
      console.log(`${b}: ${pages.length} pages found. Pages: [${pages.slice(0, 15).join(', ')}${pages.length > 15 ? '...' : ''}]`);
    });

  }).catch(err => {
    console.error('Error parsing PDF:', err);
  });
});

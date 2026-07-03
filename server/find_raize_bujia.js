const fs = require('fs');
const path = require('path');

const ngkPath = path.join(__dirname, '../public/data/toyota_bujias_ngk_2025.json');
if (fs.existsSync(ngkPath)) {
  const data = JSON.parse(fs.readFileSync(ngkPath, 'utf8'));
  const list = Array.isArray(data) ? data : (data.vehiculos || data.registros || Object.values(data));
  const matches = JSON.stringify(data, null, 2).split('\n').filter(l => l.toUpperCase().includes('RAIZE'));
  console.log('Matches:', matches);

  // Search object keys/nodes
  function search(obj) {
    if (!obj) return;
    if (typeof obj === 'object') {
      for (const k in obj) {
        if (JSON.stringify(obj[k]).toUpperCase().includes('RAIZE')) {
          if (obj[k].modelo || obj[k].bujia || obj[k].codigo) {
            console.log('Found node:', obj[k]);
          } else {
            search(obj[k]);
          }
        }
      }
    }
  }
  search(data);
}

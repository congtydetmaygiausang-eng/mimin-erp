const fs = require('fs');
const content = fs.readFileSync('apps/web/src/lib/data/real-data.ts', 'utf8');

// Find KHO_VAT_TU which has the 28 items BO-01 to BO-28 synced with VAI-01 to VAI-28
const lines = content.split('\n');
const vaiList = [];
for (let i = 1; i <= 28; i++) {
  const code = `VAI-${String(i).padStart(2, '0')}`;
  // find in lines
  const line = lines.find(l => l.includes(`maVT: "BO-${String(i).padStart(2, '0')}"`));
  if (line) {
    const tenVTMatch = line.match(/tenVT:\s*"Bo Cổ Trơn - ([^"]+)"/);
    const hinhAnhMatch = line.match(/hinhAnh:\s*"([^"]+)"/);
    vaiList.push({
      code,
      name: tenVTMatch ? tenVTMatch[1] : '',
      currentImage: hinhAnhMatch ? hinhAnhMatch[1] : ''
    });
  }
}
console.log(JSON.stringify(vaiList, null, 2));

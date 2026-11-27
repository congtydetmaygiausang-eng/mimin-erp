const path = require('path');
const xlsx = require(path.resolve(__dirname, '../../node_modules/xlsx'));
const fs = require('fs');

const filePath = path.resolve(__dirname, '../../../../Phieu_Cat_Theo_Doi_Giao_Nhan_M01_den_M16.xlsx');
const wb = xlsx.readFile(filePath);
console.log('Sheets in Phieu_Cat_Theo_Doi_Giao_Nhan_M01_den_M16.xlsx:', wb.SheetNames);

const results = {};

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  results[name] = [];
  for (let r = 10; r <= 19; r++) {
    const rowVals = [];
    for (const c of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      const cell = ws[c + r];
      rowVals.push(cell ? String(cell.v).trim().replace(/\r?\n/g, ' ') : '');
    }
    if (rowVals.some(v => v !== '')) {
      results[name].push(`R${r.toString().padStart(2, '0')}: ${rowVals.join(' | ')}`);
    }
  }
}

for (const [k, v] of Object.entries(results)) {
  console.log(`\n=== SHEET: ${k} ===`);
  v.forEach(line => console.log(line));
}

const path = require('path');
const xlsx = require(path.resolve(__dirname, '../../node_modules/xlsx'));

const files = [
  'Phieu_Cat_Theo_Doi_Giao_Nhan_M01_den_M16.xlsx',
  'Lenh_Cat_POLOMIMIN_Tong_Hop_Day_Du.xlsx'
];

for (const f of files) {
  const filePath = path.resolve(__dirname, '../../../../', f);
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets['M01'];
  if (ws) {
    console.log(`\n=== SHEET M01 in ${f} ===`);
    for (let r = 1; r <= 35; r++) {
      const vals = [];
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
        const c = ws[col + r];
        if (c && c.v !== undefined && String(c.v).trim() !== '') {
          vals.push(`${col}: ${String(c.v).trim()}`);
        }
      }
      if (vals.length > 0) {
        console.log(`R${r}: ` + vals.join(' | '));
      }
    }
  }
}

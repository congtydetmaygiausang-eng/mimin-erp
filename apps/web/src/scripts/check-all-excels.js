const path = require('path');
const xlsx = require(path.resolve(__dirname, '../../node_modules/xlsx'));
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../../../../');
const files = [
  path.join(rootDir, 'Phieu_Cat_Moi_POLOMIMIN.xlsx'),
  path.join(rootDir, 'Lenh_Cat_POLOMIMIN_Tong_Hop_Day_Du.xlsx'),
  path.join(rootDir, 'Lenh_Cat_POLOMIMIN_M02_den_M07.xlsx'),
  'C:/Users/POLOMIMIN/.gemini/antigravity/brain/6d876684-63ab-4763-ad44-fc7f42b62710/.user_uploaded/media_1795055796091_1a15db8f.xlsx'
];

for (const f of files) {
  const fullPath = path.resolve(__dirname, f);
  if (fs.existsSync(fullPath)) {
    console.log(`\n=== FILE: ${f} ===`);
    try {
      const wb = xlsx.readFile(fullPath);
      console.log('Sheets:', wb.SheetNames);
      for (const s of wb.SheetNames.slice(0, 5)) {
        const ws = wb.Sheets[s];
        console.log(`-- Sheet: ${s} (R1-R15)`);
        for (let r = 1; r <= 16; r++) {
          const rowVals = [];
          for (const c of ['A', 'B', 'C', 'D', 'E']) {
            const cell = ws[c + r];
            rowVals.push(cell ? String(cell.v).trim().replace(/\r?\n/g, ' ') : '');
          }
          if (rowVals.some(v => v !== '')) {
            console.log(`R${r.toString().padStart(2, '0')}: ${rowVals.join(' | ')}`);
          }
        }
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

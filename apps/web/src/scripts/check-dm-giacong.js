const path = require('path');
const xlsx = require(path.resolve(__dirname, '../../node_modules/xlsx'));

const filePath = path.resolve(__dirname, '../../../../Phieu_Cat_Moi_POLOMIMIN.xlsx');
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets['DM_GiaCong'];
if (ws) {
  console.log('=== SHEET DM_GiaCong ===');
  for (let r = 1; r <= 30; r++) {
    const vals = [];
    for (const c of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const cell = ws[c + r];
      if (cell && cell.v !== undefined) {
        vals.push(`${c}: ${String(cell.v).trim()}`);
      }
    }
    if (vals.length > 0) {
      console.log(`R${r}: ` + vals.join(' | '));
    }
  }
}

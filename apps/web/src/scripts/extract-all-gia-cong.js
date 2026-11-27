const path = require('path');
const xlsx = require(path.resolve(__dirname, '../../node_modules/xlsx'));

const filePath = path.resolve(__dirname, '../../../../Phieu_Cat_Moi_POLOMIMIN.xlsx');
const wb = xlsx.readFile(filePath);

const stagesMap = {};

for (const sheetName of wb.SheetNames) {
  // We care about M01 to M16, BAN196-288, etc.
  const ws = wb.Sheets[sheetName];
  // Find where CÔNG ĐOẠN table starts
  // Look for CÔNG ĐOẠN in col A or B
  let startRow = -1;
  for (let r = 5; r <= 20; r++) {
    const valA = ws['A' + r]?.v ? String(ws['A' + r].v).trim() : '';
    const valB = ws['B' + r]?.v ? String(ws['B' + r].v).trim() : '';
    if (valA.includes('CÔNG ĐOẠN') || valB.includes('CÔNG ĐOẠN')) {
      startRow = r;
      break;
    }
  }

  if (startRow > 0) {
    const stages = [];
    for (let r = startRow + 1; r <= startRow + 8; r++) {
      // Typically col A or B has stage name, col B, C or D has workshop name
      const vals = [];
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
        const c = ws[col + r];
        if (c && c.v !== undefined && String(c.v).trim() !== '') {
          vals.push(`${col}: ${String(c.v).trim()}`);
        }
      }
      if (vals.length > 0) {
        stages.push(`R${r}: ` + vals.join(' | '));
      }
    }
    stagesMap[sheetName] = stages;
  }
}

console.log(JSON.stringify(stagesMap, null, 2));

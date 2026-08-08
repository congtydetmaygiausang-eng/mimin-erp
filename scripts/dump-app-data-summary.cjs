// Dump summary of app data from code files
// 2026-08-08 - Mavis
// Parse TS files to extract data arrays (NHAN_SU, KHACH_HANG_DATA, NCCS, KHO_VAI, KHO_VAT_TU, DOI_TAC, DEFAULT_CNGC, USERS)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'apps', 'web', 'src');

function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function countArrayEntries(content, varName) {
  // Đếm số entries trong array bằng cách đếm { ở indent chính
  // Tìm: `export const VAR_NAME: TYPE = [`
  const re = new RegExp(`(?:export\\s+)?const\\s+${varName}(?::[^=]+)?=\\s*\\[`, 'm');
  const m = content.match(re);
  if (!m) return { found: false, count: 0, end: -1 };

  const startIdx = m.index + m[0].length;
  // Tìm `]` đóng array ở indent 0
  let depth = 1;
  let i = startIdx;
  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    i++;
  }
  const arrContent = content.substring(startIdx, i - 1);
  // Đếm số object bằng cách đếm `{` ở đầu dòng (indent 2 spaces)
  const lines = arrContent.split('\n');
  let count = 0;
  for (const line of lines) {
    if (/^\s{2}\{$/.test(line)) count++;
  }
  return { found: true, count, sample: arrContent.substring(0, 500) };
}

function summarize(label, file, varName) {
  const content = readSafe(path.join(ROOT, file));
  if (!content) {
    console.log(`  ❌ ${label.padEnd(30)} FILE NOT FOUND: ${file}`);
    return;
  }
  const r = countArrayEntries(content, varName);
  if (r.found) {
    console.log(`  ✅ ${label.padEnd(30)} ${String(r.count).padStart(4)} entries (${file})`);
  } else {
    console.log(`  ⚠️  ${label.padEnd(30)} VAR NOT FOUND: ${varName} (${file})`);
  }
}

console.log('=== APP DATA (mock/default trong code) ===\n');

console.log('-- Nhân sự --');
summarize('NHAN_SU (real-data.ts)', 'lib/data/real-data.ts', 'NHAN_SU');
summarize('REAL_NHAN_VIEN (real-workflow-data.ts)', 'lib/real-workflow-data.ts', 'REAL_NHAN_VIEN');

console.log('\n-- Khách hàng --');
summarize('KHACH_HANG_DATA (real-data.ts)', 'lib/data/real-data.ts', 'KHACH_HANG_DATA');

console.log('\n-- Nhà cung cấp --');
summarize('NCCS (real-data.ts)', 'lib/data/real-data.ts', 'NCCS');

console.log('\n-- Đối tác gia công --');
summarize('DOI_TAC_GIA_CONG (doi-tac-gia-cong.ts)', 'lib/doi-tac-gia-cong.ts', 'DOI_TAC_GIA_CONG');
summarize('DOI_TAC (real-data.ts)', 'lib/data/real-data.ts', 'DOI_TAC');

console.log('\n-- Kho vải --');
summarize('KHO_VAI (real-data.ts)', 'lib/data/real-data.ts', 'KHO_VAI');

console.log('\n-- Kho phụ liệu --');
summarize('KHO_VAT_TU (real-data.ts)', 'lib/data/real-data.ts', 'KHO_VAT_TU');
summarize('KHO_VAT_TU (supabase/schema.sql)', 'lib/supabase/schema.sql', 'KHO_VAT_TU');

console.log('\n-- Công nhân gia công --');
summarize('DEFAULT_CNGC (cong-nhan-gia-cong.tsx)', 'lib/data/cong-nhan-gia-cong.tsx', 'DEFAULT_CNGC');

console.log('\n-- Users (auth) --');
summarize('DEMO_USERS / USERS (users.ts)', 'lib/users.ts', 'DEMO_USERS');
summarize('USERS (users.ts)', 'lib/users.ts', 'USERS');

console.log('\n-- Khác --');
summarize('KHSX_MAU (real-data.ts)', 'lib/data/real-data.ts', 'KHSX_MAU');
summarize('BANG_LUONG_MAU (real-data.ts)', 'lib/data/real-data.ts', 'BANG_LUONG_MAU');

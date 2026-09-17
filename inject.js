const fs = require('fs');
const temp = fs.readFileSync('temp.tsx', 'utf8');
const match = temp.match(/(const MOCK_DANH_MUC: SanPham\[\] = \[\s*\{[\s\S]*?\n  \}\s*\];)/);
if (match) {
  let code = fs.readFileSync('apps/web/src/lib/data/danh-muc-sp-store.tsx', 'utf8');
  code = code.replace('const STORAGE_KEY = "mimin_danh_muc_v2";', 'const STORAGE_KEY = "mimin_danh_muc_v2";\n\n' + match[1]);
  fs.writeFileSync('apps/web/src/lib/data/danh-muc-sp-store.tsx', code);
  console.log('injected');
} else {
  console.log('not matched');
}

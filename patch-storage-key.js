const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const STORAGE_KEY = "mimin_kho_thanh_pham_v1";`,
  `const STORAGE_KEY = "mimin_kho_thanh_pham_v2";`
);

fs.writeFileSync(file, code);

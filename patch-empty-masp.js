const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix the "Chi tiết" button bug when maSP is empty
code = code.replace(
  `onClick={() => setShowMasterDetails(group.maSP)}`,
  `onClick={() => setShowMasterDetails(group.maSP || "NO_CODE")}`
);

code = code.replace(
  `const group = groupedProducts.find(g => g.maSP === showMasterDetails);`,
  `const group = groupedProducts.find(g => (g.maSP || "NO_CODE") === showMasterDetails);`
);

fs.writeFileSync(file, code);

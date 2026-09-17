const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../apps/web/src/app/(main)');
const imports = '\nimport { LOCAL_ACCOUNT_MODE } from "@/lib/local-account-mode";\nimport { localActiveAccount } from "@/lib/local-account-store";\nimport { canAccessStage } from "@/lib/account-access";\nimport { can } from "@/lib/permissions";\n';
for (const [page, flag] of [['ui-intd', 'isIntd'], ['to-may-work', 'isMay'], ['ui-ui', 'isHT'], ['ui-khuy-nut', 'isHT'], ['ui-dong-goi', 'isHT'], ['to-ht-work', 'isHT']]) {
  const file = path.join(root, page, 'page.tsx');
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes('localActiveAccount')) continue;
  source = source.replace('"use client";', '"use client";\n' + imports);
  source = source.replace('      if (user?.laCongNhan) {', `      if (LOCAL_ACCOUNT_MODE) return ${flag} && canAccessStage(localActiveAccount(), pc, "view", can);\n      if (user?.laCongNhan) {`);
  fs.writeFileSync(file, source);
}

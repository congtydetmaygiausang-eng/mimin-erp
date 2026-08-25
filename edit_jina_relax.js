const fs = require('fs');

let file = 'apps/web/src/lib/sourcing/search-engine.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Relax profile constraints
content = content.replace(
  /if\(!Array\.isArray\(profile\.fields\)\|\|profile\.status!=="READY_FOR_REVIEW"\)return null;/g, 
  'if(!Array.isArray(profile.fields)) return null;'
);

content = content.replace(
  /if\(typeof legalName!=="string"&&!taxCode\)return null;/g, 
  '// Removed legalName/taxCode requirement to allow partial profiles with phone numbers'
);

content = content.replace(
  /typeof field\.confidence==="number"&&field\.confidence>=0\.55/g, 
  'typeof field.confidence==="number"&&field.confidence>=0.30'
);

// 2. Increase Timeout for Jina Reader Gateway to 95s
content = content.replace(
  /Math\.min\(60_000,Number\(process\.env\.COMPANY_READER_ENRICHMENT_TIMEOUT_MS\?\?"55000"\)\|\|55_000\)/g, 
  'Math.min(115_000,Number(process.env.COMPANY_READER_ENRICHMENT_TIMEOUT_MS??"95000")||95_000)'
);

fs.writeFileSync(file, content);
console.log("Updated search-engine.ts for Jina Reader relaxation");

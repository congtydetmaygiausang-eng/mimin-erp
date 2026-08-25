const fs = require('fs');

let file1 = 'apps/web/src/lib/sourcing/search-engine.ts';
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(
  /COMPANY_READER_ENRICHMENT_MAX_URLS\?\?"3"/g, 
  'COMPANY_READER_ENRICHMENT_MAX_URLS??"15"'
);
content1 = content1.replace(
  /Math\.min\(10,Math\.floor\(configured\)\)\):3/g, 
  'Math.min(20,Math.floor(configured))):15'
);
content1 = content1.replace(
  /Math\.min\(55_000,Number\(process\.env\.COMPANY_READER_ENRICHMENT_TIMEOUT_MS\?\?"45000"\)\|\|45_000\)/g, 
  'Math.min(60_000,Number(process.env.COMPANY_READER_ENRICHMENT_TIMEOUT_MS??"55000")||55_000)'
);
fs.writeFileSync(file1, content1);
console.log("Updated search-engine.ts");

let file2 = 'supabase/functions/company-reader-gateway/index.ts';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /const READER_REQUEST_TIMEOUT_MS = 45_000;/g,
  'const READER_REQUEST_TIMEOUT_MS = 55_000;'
);
fs.writeFileSync(file2, content2);
console.log("Updated company-reader-gateway/index.ts");

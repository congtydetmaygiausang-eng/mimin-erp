const fs = require('fs');

let file = 'apps/web/src/app/api/v1/mimin-group/agent/tools/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const limit = typeof args\.limit === "number" \? Math\.min\(Math\.max\(Math\.round\(args\.limit\), 1\), 50\) : 20;/g, 
  'const limit = typeof args.limit === "number" ? Math.min(Math.max(Math.round(args.limit), 1), 100) : 50;'
);
content = content.replace(
  /const digestResults = limited\.slice\(0, 20\)\.map/g, 
  'const digestResults = limited.slice(0, 50).map'
);
content = content.replace(
  /truncatedForDisplay: limited\.length > 20/g, 
  'truncatedForDisplay: limited.length > 50'
);
content = content.replace(
  /const digestResults = filtered\.slice\(0, 20\)\.map/g, 
  'const digestResults = filtered.slice(0, 50).map'
);

fs.writeFileSync(file, content);
console.log("Updated route.ts");

const fs = require('fs');

let file1 = 'apps/web/src/lib/sourcing/search-engine.ts';
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(
  /return results\.slice\(0,\s*10\);/g, 
  'return results.slice(0, 30);'
);
content1 = content1.replace(
  /index === 0 \? 18_000 : 14_000/g, 
  '25_000'
);

fs.writeFileSync(file1, content1);
console.log("Updated search-engine.ts for OpenAI");

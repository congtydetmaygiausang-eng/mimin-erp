const fs = require('fs');

let file = 'supabase/functions/company-reader-gateway/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /try \{ return new URL\(url\)\.protocol === "https:"; \} catch \{ return false; \}/g,
  'try { return new URL(url).protocol.startsWith("http"); } catch { return false; }'
);

fs.writeFileSync(file, content);
console.log("Updated Edge Function validRequest protocol check");

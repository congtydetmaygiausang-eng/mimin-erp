const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
try {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Find const CACHE_NAME = "mimin-erp-v...";
  const timestamp = Date.now();
  const updatedContent = content.replace(/const CACHE_NAME = "mimin-erp-v[0-9]+";/, `const CACHE_NAME = "mimin-erp-v${timestamp}";`);
  
  if (content !== updatedContent) {
    fs.writeFileSync(swPath, updatedContent);
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'version.json'), JSON.stringify({ version: timestamp }));
    console.log(`[PWA] Successfully updated Service Worker cache version to mimin-erp-v${timestamp}`);
  } else {
    console.log('[PWA] CACHE_NAME string not found in sw.js or already updated.');
  }
} catch (error) {
  console.error('[PWA] Failed to update Service Worker cache version:', error);
}

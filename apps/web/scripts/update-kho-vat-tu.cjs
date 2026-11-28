const fs = require('fs');
const path = require('path');

const realDataPath = path.resolve('apps/web/src/lib/data/real-data.ts');
let content = fs.readFileSync(realDataPath, 'utf8');

// Replace any old swatch urls in KHO_VAT_TU with the new ones
for (let i = 1; i <= 28; i++) {
  const pad = String(i).padStart(2, '0');
  const code = `VAI-${pad}`;
  const boCode = `BO-${pad}`;
  const nutCode = `NUT-${pad}`;
  const newUrl = `https://ejcuqyaiwabfygyesvxj.supabase.co/storage/v1/object/public/san-pham-media/kho-vai-moi/swatch_${code}.jpg`;
  
  // Replace in line for BO-xx
  const boRegex = new RegExp(`(maVT:\\s*"${boCode}"[\\s\\S]*?hinhAnh:\\s*")[^"]+(")`);
  content = content.replace(boRegex, `$1${newUrl}$2`);

  // Replace in line for NUT-xx
  const nutRegex = new RegExp(`(maVT:\\s*"${nutCode}"[\\s\\S]*?hinhAnh:\\s*")[^"]+(")`);
  content = content.replace(nutRegex, `$1${newUrl}$2`);
}

fs.writeFileSync(realDataPath, content);
console.log('Updated KHO_VAT_TU in real-data.ts successfully!');

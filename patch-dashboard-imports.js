const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// Remove duplicate imports
code = code.replace(/import \{ Trash2, Search, Plus, Filter, MoreHorizontal \} from "lucide-react";\n/, '');
code = code.replace(/import \{ Trash2 \} from "lucide-react";\n/, '');

// Add Trash2 to existing lucide-react import
code = code.replace(
  /import \{ (.*) \} from "lucide-react";/,
  (match, p1) => {
    let imports = p1.split(',').map(s => s.trim());
    if (!imports.includes('Trash2')) imports.push('Trash2');
    if (!imports.includes('Plus')) imports.push('Plus');
    return `import { ${imports.join(', ')} } from "lucide-react";`;
  }
);

fs.writeFileSync(pageFile, code);
console.log("Patched imports in page.tsx successfully.");

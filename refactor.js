const fs = require('fs');
const file = 'apps/web/src/lib/sourcing/search-engine.ts';
let code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');
const newLines = lines.filter((line, i) => {
    const num = i + 1;
    if (num >= 16 && num <= 34) return false; // imports
    if (line.includes('const dr1Plan = buildDr1ShadowPlan')) return false;
    if (line.includes('const api0Baseline = buildApi0SearchBaseline')) return false;
    if (line.includes('const api') && line.includes('Audit = buildApi')) return false;
    if (line.includes('const dr') && line.includes('Audit = buildDr')) return false;
    if (line.includes('const dr') && line.includes('Baseline = buildDr')) return false;
    if (line.includes('const dr1Audit = auditDr1Execution')) return false;
    if (line.includes('toolCalls: [api0ToolCall')) return false;
    return true;
});
fs.writeFileSync(file, newLines.join('\n'));

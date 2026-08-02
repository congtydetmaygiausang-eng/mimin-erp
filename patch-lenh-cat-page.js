const fs = require('fs');

const pageFile = 'apps/web/src/app/(main)/lenh-cat/page.tsx';
let code = fs.readFileSync(pageFile, 'utf8');

// The stat cards currently use gradients like:
// violet: "from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-400"
// I will change them to be dark solid colors with white text, and slightly more compact padding.
const statCardRegex = /const colorMap: Record<string, string> = \{[\s\S]*?\};\s*return \(\s*<div className=\{`card p-4 bg-gradient-to-br \$\{colorMap\[color\]\}`\}>[\s\S]*?<\/div>\s*\);/m;

const newStatCard = `const colorMap: Record<string, string> = {
    violet: "bg-violet-900 text-violet-50",
    amber: "bg-amber-900 text-amber-50",
    emerald: "bg-emerald-900 text-emerald-50",
    sky: "bg-sky-900 text-sky-50",
  };
  return (
    <div className={\`rounded-xl p-3 shadow-md \${colorMap[color]}\`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80 mb-1">
        {icon}<span>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] opacity-70 mt-1 font-medium">{sub}</div>}
    </div>
  );`;

code = code.replace(statCardRegex, newStatCard);

fs.writeFileSync(pageFile, code);
console.log("Patched page.tsx successfully.");

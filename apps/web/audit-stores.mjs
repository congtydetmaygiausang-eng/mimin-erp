// Audit all stores - check STORAGE_KEY + supabase sync pattern
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const dir = "D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/data";
const files = readdirSync(dir).filter(f => f.endsWith(".tsx")).sort();

console.log("STT | Store".padEnd(28) + "| STORAGE_KEY".padEnd(35) + "| supabaseUpsert".padEnd(20) + "| supabaseDelete".padEnd(20) + "| supabaseFetchAll");
console.log("-".repeat(135));

let i = 1;
for (const f of files) {
  const path = join(dir, f);
  const stat = statSync(path);
  if (!stat.isFile()) continue;
  const content = readFileSync(path, "utf-8");

  const storageMatch = content.match(/const STORAGE_KEY\s*=\s*"([^"]+)"/);
  const storage = storageMatch ? storageMatch[1] : "(none)";

  const upserts = [...content.matchAll(/supabaseUpsert\("([^"]+)"/g)].map(m => m[1]);
  const deletes = [...content.matchAll(/supabaseDelete\("([^"]+)"/g)].map(m => m[1]);
  const fetches = [...content.matchAll(/supabaseFetchAll/g)].length;

  console.log(
    `${String(i).padStart(3)} | ${f.padEnd(25)}| ${storage.padEnd(33)}| U=${upserts.length} (${upserts.join(",") || "-"}).padEnd(15) | D=${deletes.length} (${deletes.join(",") || "-"}).padEnd(15) | F=${fetches}`
  );
  i++;
}
console.log("-".repeat(135));
console.log("\nBáo cáo sẽ lưu vào: scripts/audit-stores-report.json");

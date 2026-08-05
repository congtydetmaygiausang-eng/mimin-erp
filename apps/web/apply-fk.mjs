// Apply FK constraints len Supabase Pro
// 2026-08-05 - Mavis
import { readFileSync } from "node:fs";

const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;
const SQL_FILE = "D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/APPLY-FK-CONSTRAINTS.sql";

async function main() {
  console.log(`📄 Reading ${SQL_FILE}...`);
  const sql = readFileSync(SQL_FILE, "utf-8");
  console.log(`✅ File size: ${sql.length} chars`);

  console.log("⏳ Applying FK constraints...");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    console.error(await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("✅ Apply thanh cong!");
  console.log(JSON.stringify(data, null, 2));
}
main().catch((e) => { console.error("💥", e); process.exit(1); });

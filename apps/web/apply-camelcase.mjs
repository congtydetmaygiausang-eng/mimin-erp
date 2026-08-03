// Apply APPLY-SUPABASE-CAMELCASE.sql qua Supabase Management API
// Usage: node apply-camelcase.mjs <PAT>

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PAT = process.argv[2] || process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Can PAT: node apply-camelcase.mjs sbp_xxx");
  process.exit(1);
}

const sql = readFileSync(resolve(__dirname, "../../APPLY-SUPABASE-CAMELCASE.sql"), "utf8");
console.log("📄 Applying APPLY-SUPABASE-CAMELCASE.sql");
console.log("   Size:", (sql.length / 1024).toFixed(1), "KB");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("❌ HTTP", res.status);
  console.error(text.slice(0, 1000));
  process.exit(1);
}

const data = await res.json().catch(() => ({}));
console.log("✅ Applied!");

// Verify
const v = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('lenh_cat','mau_cong_doan','mau_chi_phi') AND column_name IN ('loaiLenh','maSP','tenSP','tongSL','bangCOGS','loaiSP') ORDER BY table_name, column_name`,
  }),
});
const rows = await v.json();
console.log("\n📋 Sample camelCase columns:");
rows.forEach((r) => console.log("  " + r.table_name + "." + r.column_name));

// Apply APPLY-USERS-TABLE.sql qua Supabase Management API
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PAT = process.argv[2] || process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Can PAT: SUPABASE_PAT=xxx node apply-users-table.mjs");
  process.exit(1);
}

const sql = readFileSync(resolve(__dirname, "../../APPLY-USERS-TABLE.sql"), "utf8");
console.log("📄 Applying APPLY-USERS-TABLE.sql");
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

console.log("✅ Applied!");

// Verify
const v = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position`,
  }),
});
const rows = await v.json();
console.log(`\n📋 Bảng users có ${rows.length} cột:`);
rows.forEach((r) => console.log("  - " + r.column_name));

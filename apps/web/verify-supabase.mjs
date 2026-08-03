// Quick verify schema - PAT passed via env var SUPABASE_PAT
const PAT = process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Can SUPABASE_PAT env var");
  console.error("   PowerShell: $env:SUPABASE_PAT='sbp_xxx'; node verify-supabase.mjs");
  process.exit(1);
}

(async () => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        SELECT
          table_schema,
          COUNT(*) AS table_count
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_type = 'BASE TABLE'
        GROUP BY table_schema
        ORDER BY table_schema
      `,
    }),
  });
  const data = await res.json();
  console.log("📊 Schemas và số bảng:");
  data.forEach((r) => console.log(`  ${r.table_schema.padEnd(20)}: ${r.table_count} bảng`));

  // Tables in public
  const t = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    }),
  });
  const tables = await t.json();
  console.log(`\n📋 Schema public có ${tables.length} bảng:`);
  tables.forEach((r, i) => console.log(`  ${(i + 1).toString().padStart(2)}. ${r.table_name}`));
})();

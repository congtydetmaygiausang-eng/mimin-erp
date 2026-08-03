// Verify schema Supabase Pro
// Usage (PowerShell):
//   $env:SUPABASE_PAT="sbp_xxx"; node verify-supabase.mjs

const PAT = process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Cần SUPABASE_PAT env var");
  console.error("   PowerShell: $env:SUPABASE_PAT='sbp_xxx'; node verify-supabase.mjs");
  process.exit(1);
}

(async () => {
  // List tables
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    }),
  });
  const tables = await res.json();
  console.log(`📊 Tổng số bảng: ${tables.length}`);
  tables.forEach((r, i) => console.log(`  ${(i + 1).toString().padStart(2)}. ${r.table_name}`));

  // Count rows
  console.log("\n📋 Rows trong các bảng quan trọng:");
  const keyTables = [
    "nha_cung_cap", "lenh_cat", "mau_cong_doan", "mau_chi_phi",
    "nhan_su", "don_hang", "cong_no", "kho_vai", "kho_nguyen_lieu",
    "giao_dich_kho", "khach_hang", "khsx", "qc_records",
    "hoan_thien", "giao_hang", "gia_cong", "doi_soat", "kho_mobile",
    "phan_cong", "bang_luong", "users",
  ];
  for (const t of keyTables) {
    try {
      const r2 = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${PAT}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `SELECT COUNT(*) AS c FROM ${t}` }),
      });
      const d = await r2.json();
      console.log(`  ${t.padEnd(22)}: ${d[0]?.c || 0} rows`);
    } catch (e) {
      console.log(`  ${t.padEnd(22)}: (không tồn tại hoặc lỗi)`);
    }
  }
})();

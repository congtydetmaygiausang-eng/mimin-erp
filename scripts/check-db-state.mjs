// Check rows in key tables to decide if we can DROP+RECREATE
// Usage: SUPABASE_PAT=xxx node scripts/check-db-state.mjs
const PAT = process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Cần SUPABASE_PAT env var");
  process.exit(1);
}

const tables = [
  "nha_cung_cap", "lenh_cat", "mau_cong_doan", "mau_chi_phi",
  "nhan_su", "don_hang", "cong_no", "kho_vai", "kho_nguyen_lieu",
  "giao_dich_kho", "khach_hang", "khsx", "qc_records",
  "hoan_thien", "giao_hang", "gia_cong", "doi_soat", "kho_mobile",
  "phan_cong", "bang_luong", "users",
];

(async () => {
  for (const t of tables) {
    try {
      const r = await fetch(
        `https://api.supabase.com/v1/projects/${REF}/database/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: `SELECT COUNT(*) AS c FROM ${t}` }),
        }
      );
      const d = await r.json();
      console.log(`  ${t.padEnd(22)}: ${d[0]?.c || 0} rows`);
    } catch (e) {
      console.log(`  ${t.padEnd(22)}: error`);
    }
  }
})();

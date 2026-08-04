// ============================================
// AUDIT-SCHEMA-DETAIL.MJS - Schema chi tiết các bảng chính
// ============================================
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

const IMPORTANT_TABLES = [
  "lenh_cat", "mau_cong_doan", "mau_chi_phi", "cong_no", "khsx",
  "qc_records", "hoan_thien", "giao_hang", "gia_cong", "doi_soat", "kho_mobile",
  "don_hang", "phan_cong", "giao_dich_kho", "nha_cung_cap", "khach_hang",
  "nhan_su", "users", "vat_tu", "bang_chi_phi_co_dinh"
];

async function main() {
  console.log("📋 SCHEMA CHI TIẾT CÁC BẢNG QUAN TRỌNG");
  console.log("=".repeat(100));
  console.log("");

  for (const t of IMPORTANT_TABLES) {
    try {
      const cols = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${t}'
        ORDER BY ordinal_position
      `);

      if (cols.length === 0) {
        console.log(`❌ ${t}: KHÔNG TỒN TẠI`);
        continue;
      }

      // Detect naming style
      const hasCamel = cols.some(c => /[a-z][A-Z]/.test(c.column_name));
      const hasSnake = cols.some(c => /_/.test(c.column_name));
      const style = hasCamel && hasSnake ? "🔀 MIXED" : hasCamel ? "🐪 camelCase" : "🐍 snake_case";

      console.log(`\n📦 ${t} (${cols.length} cols, ${style})`);
      console.log("-".repeat(80));
      cols.forEach(c => {
        const camelIndicator = /[a-z][A-Z]/.test(c.column_name) ? " 🐪" : "";
        console.log(`   ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} ${c.is_nullable === "NO" ? "NOT NULL" : "NULL"}${camelIndicator}`);
      });
    } catch (err) {
      console.log(`\n❌ ${t}: LỖI - ${err.message}`);
    }
  }
  console.log("\n" + "=".repeat(100));
  console.log("✅ Hoàn tất");
}

main().catch(err => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});

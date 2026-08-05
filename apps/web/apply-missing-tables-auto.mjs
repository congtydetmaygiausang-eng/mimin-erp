// ============================================
// APPLY-MISSING-TABLES-AUTO.MJS
// Tu dong apply SQL len Supabase Pro qua Management API
// ============================================
// 2026-08-05 - Mavis

import { readFileSync } from "fs";

const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;
const SQL_FILE = "D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/APPLY-MISSING-TABLES.sql";

if (!PAT) {
  console.error("❌ Can set env SUPABASE_PAT");
  process.exit(1);
}

// Read SQL file
console.log(`📄 Reading ${SQL_FILE}...`);
let sql;
try {
  sql = readFileSync(SQL_FILE, "utf-8");
  console.log(`✅ File size: ${sql.length} chars`);
} catch (err) {
  console.error(`❌ Cannot read SQL file: ${err.message}`);
  process.exit(1);
}

// Send to Management API
async function applySql() {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  console.log(`\n🚀 Applying SQL to ${PROJECT_REF}...`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ HTTP ${res.status}`);
    console.error("Response:", errText.substring(0, 2000));
    return false;
  }

  const data = await res.json();
  console.log(`✅ SQL applied successfully!`);
  if (Array.isArray(data)) {
    console.log(`   Rows returned: ${data.length}`);
    if (data.length > 0) {
      console.log(`   First row sample:`, JSON.stringify(data[0]).substring(0, 200));
    }
  } else if (typeof data === "object") {
    console.log(`   Response:`, JSON.stringify(data).substring(0, 500));
  }
  return true;
}

// Verify
async function verify() {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  console.log(`\n🔍 Verifying...`);

  // List tables
  const tablesRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS cols FROM information_schema.tables t WHERE table_schema = 'public' ORDER BY table_name`,
    }),
  });
  const tables = await tablesRes.json();
  console.log(`\n📋 Total tables: ${tables.length}`);

  // Count rows in key tables
  const countRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `SELECT 'lenh_cat' AS tbl, COUNT(*) FROM lenh_cat UNION ALL SELECT 'mau_cong_doan', COUNT(*) FROM mau_cong_doan UNION ALL SELECT 'mau_chi_phi', COUNT(*) FROM mau_chi_phi UNION ALL SELECT 'phan_cong', COUNT(*) FROM phan_cong UNION ALL SELECT 'khsx', COUNT(*) FROM khsx UNION ALL SELECT 'qc_records', COUNT(*) FROM qc_records UNION ALL SELECT 'hoan_thien', COUNT(*) FROM hoan_thien UNION ALL SELECT 'giao_hang', COUNT(*) FROM giao_hang UNION ALL SELECT 'gia_cong', COUNT(*) FROM gia_cong UNION ALL SELECT 'doi_soat', COUNT(*) FROM doi_soat UNION ALL SELECT 'kho_mobile', COUNT(*) FROM kho_mobile UNION ALL SELECT 'cong_no', COUNT(*) FROM cong_no UNION ALL SELECT 'cong_nhan_gia_cong', COUNT(*) FROM cong_nhan_gia_cong`,
    }),
  });
  const counts = await countRes.json();
  console.log(`\n📊 Row counts in key tables:`);
  counts.forEach((r) => {
    console.log(`   ${r.tbl.padEnd(25)} ${r.count} rows`);
  });
}

(async () => {
  const ok = await applySql();
  if (ok) {
    await verify();
  }
})();

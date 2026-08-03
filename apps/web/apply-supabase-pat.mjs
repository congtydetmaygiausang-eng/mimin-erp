// Apply schema Supabase Pro qua Management API (dùng Personal Access Token)
// Chạy 2 file SQL: APPLY-SUPABASE-MANUAL.sql + APPLY-SUPABASE-EXTRA.sql
//
// Usage (PowerShell):
//   $env:SUPABASE_PAT="sbp_xxxxx"; node apply-supabase-pat.mjs
//
// Hoặc pass PAT as arg:
//   node apply-supabase-pat.mjs sbp_xxxxx

import { readFileSync } from "fs";
import { resolve } from "path";

const PAT = process.argv[2] || process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Cần Personal Access Token (PAT)");
  console.error("   PowerShell: $env:SUPABASE_PAT='sbp_xxx'; node apply-supabase-pat.mjs");
  console.error("   Hoặc: node apply-supabase-pat.mjs sbp_xxx");
  process.exit(1);
}

console.log("🔌 Kết nối Supabase Management API...");
console.log("   Project:", REF);
console.log("   PAT:", PAT.slice(0, 12) + "...");

async function runSql(sql, label) {
  console.log(`\n📄 Đang chạy ${label} (${(sql.length / 1024).toFixed(1)} KB)...`);

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`   ❌ HTTP ${res.status}:`);
      console.error(`      ${text.slice(0, 500)}`);
      return false;
    }

    const data = await res.json().catch(() => ({}));
    console.log(`   ✅ ${label} applied thành công!`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   (${data.length} rows trả về từ query cuối)`);
    }
    return true;
  } catch (err) {
    console.error(`   ❌ Network error: ${err.message}`);
    return false;
  }
}

async function main() {
  // Apply MANUAL
  const manual = readFileSync(resolve("../../APPLY-SUPABASE-MANUAL.sql"), "utf8");
  const r1 = await runSql(manual, "MANUAL (18 bảng + 20 NCC + 18 NV)");
  if (!r1) {
    console.log("\n⚠️ MANUAL fail → dừng EXTRA");
    process.exit(1);
  }

  // Apply EXTRA
  const extra = readFileSync(resolve("../../APPLY-SUPABASE-EXTRA.sql"), "utf8");
  const r2 = await runSql(extra, "EXTRA (8 bảng bổ sung)");
  if (!r2) {
    console.log("\n⚠️ EXTRA fail nhưng MANUAL OK");
  }

  // Verify: count tables
  console.log("\n🔍 Verify: đếm số bảng...");
  const verifySql = `
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS table_count,
      (SELECT COUNT(*) FROM nha_cung_cap) AS ncc_count,
      (SELECT COUNT(*) FROM nhan_su) AS nhan_su_count
  `;
  const verifyRes = await runSql(verifySql, "VERIFY");
  if (Array.isArray(verifyRes) && verifyRes.length > 0) {
    console.log("   📊 Kết quả:", verifyRes[0] || verifyRes);
  }

  console.log("\n🎉 HOÀN TẤT! Schema Supabase Pro đã sẵn sàng.");
  console.log("   Bước tiếp theo:");
  console.log("   1. Xoá PAT (đã dùng xong): https://supabase.com/dashboard/account/tokens");
  console.log("   2. Vào Vercel → Deployments → bấm Redeploy");
  console.log("   3. Vào mimin-erp.vercel.app test sync localStorage ↔ Supabase");
}

main().catch((err) => {
  console.error("\n❌ Lỗi:", err);
  process.exit(1);
});

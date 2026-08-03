// Apply schema Supabase Pro (ejcuqyaiwabfygyesvxj) tự động
// Chạy 2 file SQL: APPLY-SUPABASE-MANUAL.sql (18 bảng + 20 NCC + 18 NV) + APPLY-SUPABASE-EXTRA.sql (8 bảng bổ sung)
//
// Cách chạy (từ máy của anh Sang):
//   cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
//   node apply-supabase-auto.mjs

import pg from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim() : null;
};

const dbUrl = get("DATABASE_URL");
const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL");

if (!dbUrl) {
  console.error("❌ Chưa có DATABASE_URL trong .env.local");
  process.exit(1);
}

console.log("🔌 Đang kết nối Supabase Pro...");
console.log("   URL:", supabaseUrl);
console.log("   DB:", dbUrl.split("@")[1]?.split("/")[0] || "hidden");

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function runSqlFile(filePath, label) {
  console.log(`\n📄 Đang chạy ${label}: ${filePath}`);
  const sql = readFileSync(resolve(filePath), "utf8");
  console.log(`   Kích thước: ${(sql.length / 1024).toFixed(1)} KB`);

  try {
    await client.query(sql);
    console.log(`   ✅ ${label} applied thành công!`);
    return true;
  } catch (err) {
    console.error(`   ❌ Lỗi khi apply ${label}:`);
    console.error(`      ${err.message}`);
    return false;
  }
}

async function main() {
  try {
    await client.connect();
    console.log("✅ Đã kết nối Supabase!");

    // Apply 2 file SQL
    const r1 = await runSqlFile(
      "../APPLY-SUPABASE-MANUAL.sql",
      "MANUAL (18 bảng + 20 NCC + 18 NV)"
    );
    if (!r1) {
      console.log("\n⚠️ MANUAL fail → dừng EXTRA để tránh lỗi");
      process.exit(1);
    }

    const r2 = await runSqlFile(
      "../APPLY-SUPABASE-EXTRA.sql",
      "EXTRA (8 bảng bổ sung cho 8 store)"
    );
    if (!r2) {
      console.log("\n⚠️ EXTRA fail nhưng MANUAL OK");
    }

    // Verify: count tables
    console.log("\n🔍 Verify: đếm số bảng trong schema public...");
    const res = await client.query(`
      SELECT COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);
    const count = parseInt(res.rows[0].table_count, 10);
    console.log(`   📊 Tổng số bảng: ${count}`);

    // List tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log("\n📋 Danh sách bảng:");
    tables.rows.forEach((row, i) => {
      console.log(`   ${(i + 1).toString().padStart(2)}. ${row.table_name}`);
    });

    // Count rows in key tables
    console.log("\n📊 Đếm rows các bảng quan trọng:");
    const keyTables = ["nha_cung_cap", "users", "nhan_su", "lenh_cat", "don_hang"];
    for (const t of keyTables) {
      try {
        const r = await client.query(`SELECT COUNT(*) AS c FROM ${t}`);
        console.log(`   ${t.padEnd(20)} : ${r.rows[0].c} rows`);
      } catch {
        console.log(`   ${t.padEnd(20)} : (không tồn tại hoặc lỗi)`);
      }
    }

    console.log("\n🎉 HOÀN TẤT! Schema Supabase Pro đã sẵn sàng.");
    console.log("   Giờ anh Sang có thể:");
    console.log("   1. Vào Vercel → Deployments → bấm Redeploy");
    console.log("   2. Vào mimin-erp.vercel.app test sync localStorage ↔ Supabase");
  } catch (err) {
    console.error("\n❌ Lỗi:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

// Apply Supabase schema tự động qua pg client (PostgreSQL thuần)
// Cần DATABASE_URL trong .env.local
//
// Cách chạy (từ máy của anh Sang - máy em bị sandbox block DNS):
//   cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
//   node apply-schema.mjs
//
// Nếu schema đã apply 1 phần, chạy lại vẫn OK (script skip lỗi "already exists")

import pg from "pg";
import { readFileSync, existsSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim() : null;
};

const dbUrl = get("DATABASE_URL");
if (!dbUrl) {
  console.error("❌ Chưa có DATABASE_URL trong .env.local");
  console.error("");
  console.error("📋 Cách lấy DATABASE_URL:");
  console.error("1. Mở: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/database");
  console.error("2. Mục 'Connection string' → tab 'URI'");
  console.error("3. Nếu chưa có password: click 'Reset database password' trước");
  console.error("4. Copy connection string (dạng: postgresql://postgres.nftlwdcsmlpeiazhuoho:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres)");
  console.error("5. Paste vào .env.local:");
  console.error("   DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres");
  process.exit(1);
}

console.log("🔌 Đang kết nối Supabase...");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("✅ Đã kết nối!");

  // Đọc file schema (ưu tiên all-schemas-combined.sql, fallback về 2 file cũ)
  const schemaPaths = [
    "all-schemas-combined.sql",
    "src/lib/supabase/schema.sql",
  ];

  let combinedSql = "";
  for (const p of schemaPaths) {
    if (existsSync(p)) {
      console.log(`📄 Đọc ${p}...`);
      combinedSql += `\n-- ===== ${p} =====\n` + readFileSync(p, "utf8");
    }
  }

  // Append advanced-schema.sql nếu có
  if (existsSync("src/lib/supabase/advanced-schema.sql")) {
    console.log("📄 Đọc src/lib/supabase/advanced-schema.sql...");
    combinedSql += `\n-- ===== advanced-schema.sql =====\n` + readFileSync("src/lib/supabase/advanced-schema.sql", "utf8");
  }

  if (!combinedSql.trim()) {
    throw new Error("Không tìm thấy file SQL nào");
  }
  console.log(`   Tổng: ${combinedSql.length} ký tự\n`);

  // Chia SQL thành các statement riêng biệt (theo dấu ;)
  // Bỏ qua comment và string literals khi tách
  const statements = splitSql(combinedSql);
  console.log(`🔨 Apply ${statements.length} SQL statements...\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const failedList = [];

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i].trim();
    if (!sql || sql.startsWith("--")) continue;

    try {
      await client.query(sql);
      success++;
      // Log tiến độ mỗi 10 statement
      if ((i + 1) % 10 === 0 || i === statements.length - 1) {
        console.log(`   ✓ ${i + 1}/${statements.length}`);
      }
    } catch (err) {
      const msg = err.message || String(err);
      // Bỏ qua lỗi "đã tồn tại" - OK vì schema có DROP IF EXISTS ở đầu nhưng vẫn có thể sót
      if (
        msg.includes("already exists") ||
        msg.includes("does not exist") && msg.includes("policy") ||
        msg.includes("duplicate key") ||
        msg.includes("relation") && msg.includes("already") ||
        msg.includes("CREATE TABLE") && msg.includes("already") ||
        msg.includes("permission denied")  // OK - schema cũ có RLS chặn
      ) {
        skipped++;
        console.log(`   ⏭️  Skip: ${msg.split("\n")[0].slice(0, 80)}`);
      } else {
        failed++;
        failedList.push({ idx: i, sql: sql.slice(0, 100), error: msg });
        console.log(`   ❌ Fail #${i + 1}: ${msg.split("\n")[0].slice(0, 100)}`);
      }
    }
  }

  console.log(`\n📊 Kết quả:`);
  console.log(`   ✅ Thành công: ${success}`);
  console.log(`   ⏭️  Bỏ qua (đã tồn tại): ${skipped}`);
  console.log(`   ❌ Lỗi: ${failed}`);

  if (failed > 0) {
    console.log(`\n⚠️  Các statement lỗi (5 đầu tiên):`);
    failedList.slice(0, 5).forEach((f) => {
      console.log(`   - #${f.idx}: ${f.error.split("\n")[0].slice(0, 100)}`);
      console.log(`     SQL: ${f.sql.slice(0, 80)}...`);
    });
  }

  // Verify: list tables
  console.log("\n📊 Kiểm tra tables đã tạo:");
  const r = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log(`   Tổng: ${r.rows.length} bảng trong schema 'public'`);
  r.rows.forEach((row, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${row.tablename}`);
  });

  console.log("\n🎉 HOÀN THÀNH!");
  console.log("👉 Verify tại: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/editor");
} catch (err) {
  console.error("\n❌ LỖI:", err.message);
  if (err.message.includes("password")) {
    console.error("\n💡 Sai password. Vui lòng:");
    console.error("1. Vào Supabase Dashboard → Settings → Database");
    console.error("2. Click 'Reset database password' để reset");
    console.error("3. Copy password mới, update DATABASE_URL trong .env.local");
  } else if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    console.error("\n💡 Không kết nối được. Kiểm tra:");
    console.error("1. DATABASE_URL đúng format chưa");
    console.error("2. Internet OK chưa");
    console.error("3. Project Supabase còn hoạt động không");
  }
  process.exit(1);
} finally {
  await client.end();
}

/**
 * Tách SQL thành các statement riêng biệt theo dấu ;
 * Bỏ qua dấu ; bên trong comment (--) và string literals (' ')
 */
function splitSql(sql) {
  const result = [];
  let current = "";
  let i = 0;
  let inString = false;
  let stringChar = "";
  let inLineComment = false;

  while (i < sql.length) {
    const ch = sql[i];
    const nextCh = sql[i + 1] || "";

    // Xử lý comment dòng --
    if (!inString && ch === "-" && nextCh === "-") {
      // Bỏ qua đến hết dòng
      while (i < sql.length && sql[i] !== "\n") i++;
      continue;
    }

    // Xử lý comment block /* */
    if (!inString && ch === "/" && nextCh === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // Xử lý string literal
    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      stringChar = ch;
      current += ch;
      i++;
      continue;
    }

    if (inString) {
      current += ch;
      if (ch === stringChar) {
        // Kiểm tra escape ''
        if (nextCh === stringChar) {
          current += nextCh;
          i += 2;
          continue;
        }
        inString = false;
        stringChar = "";
      }
      i++;
      continue;
    }

    // Dấu ; kết thúc statement
    if (ch === ";") {
      current = current.trim();
      if (current) result.push(current);
      current = "";
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Statement cuối không có ;
  current = current.trim();
  if (current) result.push(current);

  return result;
}

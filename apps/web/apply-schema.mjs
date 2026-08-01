// Apply Supabase schema tự động qua pg client
// Cần DATABASE_URL trong .env.local (anh Sang copy từ Supabase Dashboard)
import pg from "pg";
import { readFileSync } from "fs";

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

  // 1. Đọc schema.sql
  console.log("\n📄 Đọc schema.sql...");
  const schemaSql = readFileSync("src/lib/supabase/schema.sql", "utf8");
  console.log(`   ${schemaSql.length} ký tự`);

  // 2. Đọc advanced-schema.sql
  console.log("📄 Đọc advanced-schema.sql...");
  const advSql = readFileSync("src/lib/supabase/advanced-schema.sql", "utf8");
  console.log(`   ${advSql.length} ký tự`);

  // 3. Apply schema.sql
  console.log("\n🔨 Đang apply schema.sql (10 bảng chính)...");
  await client.query(schemaSql);
  console.log("✅ schema.sql OK!");

  // 4. Apply advanced-schema.sql
  console.log("\n🔨 Đang apply advanced-schema.sql (audit_logs, RLS, 2FA)...");
  await client.query(advSql);
  console.log("✅ advanced-schema.sql OK!");

  // 5. Verify: list tables
  console.log("\n📊 Kiểm tra tables đã tạo:");
  const r = await client.query(`
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log(`   Tổng: ${r.rows.length} bảng trong schema 'public'`);
  r.rows.forEach((row, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${row.tablename}`);
  });

  console.log("\n🎉 HOÀN THÀNH! Schema đã được apply lên Supabase.");
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

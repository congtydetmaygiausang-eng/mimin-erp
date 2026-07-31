// ============================================
// MIMIN ERP - Auto-apply Supabase migrations
// Chạy: node apply-migrations.js
// Yêu cầu: thêm DATABASE_URL vào apps/web/.env.local
// ============================================

const fs = require("fs");
const path = require("path");
const https = require("https");

// ============================================
// 1. PARSE .ENV.LOCAL (không in value ra console)
// ============================================
function loadEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
  return env;
}

const ENV_PATH = path.join(__dirname, "apps", "web", ".env.local");
const env = loadEnv(ENV_PATH);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = env.DATABASE_URL;

console.log("\n🔍 MIMIN ERP - Apply Migrations\n");
console.log(`   Env file: ${ENV_PATH}`);
console.log(`   Env exists: ${fs.existsSync(ENV_PATH) ? "✅" : "❌"}`);
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? "✅ set" : "❌ missing"}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? "✅ set (" + SERVICE_ROLE_KEY.length + " chars)" : "❌ missing"}`);
console.log(`   DATABASE_URL: ${DATABASE_URL ? "✅ set" : "❌ missing"}`);

if (!SUPABASE_URL) {
  console.error("\n❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// ============================================
// 2. CHECK CURRENT SCHEMA (qua PostgREST)
// ============================================
async function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers,
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    }).on("error", reject);
  });
}

(async () => {
  console.log("\n📡 Checking current schema via PostgREST...");
  const tables = await fetchJson(`${SUPABASE_URL}/rest/v1/`, {
    "apikey": SERVICE_ROLE_KEY || "",
    "Authorization": `Bearer ${SERVICE_ROLE_KEY || ""}`,
  });

  if (tables.status === 200) {
    const tableNames = Object.keys(tables.data.paths || {})
      .filter(p => !p.includes("/rpc/"))
      .map(p => p.replace(/^\/+/, "").split("/")[0])
      .filter((v, i, a) => a.indexOf(v) === i);
    console.log(`   Found ${tableNames.length} tables/views exposed via PostgREST`);
    if (tableNames.length > 0) {
      console.log(`   Tables: ${tableNames.slice(0, 10).join(", ")}${tableNames.length > 10 ? "..." : ""}`);
    }
  } else if (tables.status === 401) {
    console.log(`   ⚠️  401 Unauthorized - cần service_role key để check`);
  } else {
    console.log(`   Status: ${tables.status}`);
  }

  // ============================================
  // 3. CÁCH 1: HƯỚNG DẪN SẾP CHẠY QUA 3 PHƯƠNG ÁN
  // ============================================
  console.log("\n" + "═".repeat(60));
  console.log("📋 CÓ 3 CÁCH APPLY MIGRATIONS (chọn 1)");
  console.log("═".repeat(60));

  // Phương án A: SQL Editor (web UI - đơn giản nhất)
  console.log("\n🅰️  CÁCH 1: Supabase SQL Editor (KHUYẾN NGHỊ - 1 phút)");
  console.log("   1. Mở: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new");
  console.log("   2. Mở file: " + path.resolve("supabase-migrations/001_init_schema.sql"));
  console.log("   3. Copy toàn bộ nội dung → Paste vào SQL Editor");
  console.log("   4. Click 'Run' (Ctrl+Enter)");
  console.log("   5. Đợi ~10s → Báo em để verify");

  // Phương án B: psql (cần DATABASE_URL)
  if (DATABASE_URL) {
    console.log("\n🅱️  CÁCH 2: psql command");
    console.log("   Mở Git Bash / PowerShell, chạy:");
    console.log(`   cd ${path.resolve(".")}`);
    console.log(`   psql "${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}" -f supabase-migrations/001_init_schema.sql`);
    console.log("   (psql sẽ tự ẩn password trong error log)");
  } else {
    console.log("\n🅱️  CÁCH 2: psql command");
    console.log("   ⚠️  Cần thêm DATABASE_URL vào .env.local:");
    console.log("   DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres");
    console.log("   Lấy từ: Dashboard > Database > Connection string > URI");
  }

  // Phương án C: Management API (cần access token, nâng cao)
  console.log("\n🅲  CÁCH 3: Supabase Management API (cần access token)");
  console.log("   Chỉ dùng khi muốn tự động hoá toàn bộ CI/CD");

  console.log("\n" + "═".repeat(60));
  console.log("⏭️  SAU KHI APPLY XONG, chạy lệnh này để verify:");
  console.log("    node verify-supabase.js");
  console.log("═".repeat(60));
  console.log();
})();

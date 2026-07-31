// ============================================
// MIMIN ERP - Verify Supabase sau khi apply migrations
// Chạy: node verify-supabase.js
// ============================================

const fs = require("fs");
const path = require("path");
const https = require("https");

// ============================================
// PARSE .ENV.LOCAL (không in value)
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

console.log("\n🔍 MIMIN ERP - Verify Supabase Schema\n");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  console.error(`   SUPABASE_URL: ${SUPABASE_URL ? "✅" : "❌"}`);
  console.error(`   SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? "✅" : "❌"}`);
  process.exit(1);
}

// ============================================
// EXPECTED SCHEMA
// ============================================
const EXPECTED_TABLES = [
  "users", "tasks", "kho", "cong_no",
  "nha_cung_cap", "khach_hang_si", "xuong_gia_cong",
  "audit_log", "notifications", "lenh_sx_tong",
];

const EXPECTED_INDEXES = [
  "idx_users_username", "idx_users_nhom", "idx_users_role",
  "idx_nha_cung_cap_ma", "idx_nha_cung_cap_loai", "idx_nha_cung_cap_cong_no",
  "idx_khach_hang_si_ma", "idx_khach_hang_si_loai", "idx_khach_hang_si_cong_no",
  "idx_kho_sku", "idx_kho_loai", "idx_kho_don_gia", "idx_kho_nha_cung_cap", "idx_kho_ngay_het_han",
  "idx_lenh_sx_tong_trang_thai", "idx_lenh_sx_tong_ma_sp",
  "idx_audit_log_user", "idx_audit_log_created_at", "idx_audit_log_action", "idx_audit_log_module",
];

// ============================================
// HTTP HELPERS
// ============================================
function fetchJson(url, headers) {
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

function postJson(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers },
    }, (res) => {
      let result = "";
      res.on("data", (chunk) => (result += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(result) }); }
        catch { resolve({ status: res.statusCode, data: result }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const authHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

// ============================================
// CHECK TABLES (count rows in each)
// ============================================
async function checkTable(name) {
  try {
    const res = await fetchJson(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=1`, authHeaders);
    if (res.status === 200) {
      // Lấy count bằng Prefer: count=exact
      const countRes = await fetchJson(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=0`, {
        ...authHeaders,
        Prefer: "count=exact",
      });
      const rangeHeader = countRes.data?.range || countRes.headers?.["content-range"] || "";
      const count = rangeHeader.split("/")[1] || "?";
      return { exists: true, count, status: res.status };
    }
    return { exists: false, status: res.status, error: res.data };
  } catch (e) {
    return { exists: false, status: 0, error: e.message };
  }
}

(async () => {
  console.log(`📡 Connecting to ${SUPABASE_URL.replace(/\/\/.+@/, "//***@")}...\n`);

  let tablesOk = 0;
  let tablesMissing = 0;
  let totalRows = 0;

  console.log("📊 TABLES CHECK");
  console.log("─".repeat(60));
  for (const t of EXPECTED_TABLES) {
    const r = await checkTable(t);
    if (r.exists) {
      tablesOk++;
      totalRows += parseInt(r.count) || 0;
      console.log(`   ✅ ${t.padEnd(20)} ${String(r.count).padStart(8)} rows`);
    } else {
      tablesMissing++;
      console.log(`   ❌ ${t.padEnd(20)} NOT FOUND (${r.status})`);
    }
  }
  console.log("─".repeat(60));
  console.log(`   ${tablesOk}/${EXPECTED_TABLES.length} tables OK, ${totalRows} total rows`);
  if (tablesMissing > 0) {
    console.log(`\n⚠️  ${tablesMissing} tables missing. Apply migrations trước.`);
    console.log(`   Chạy: node apply-migrations.js`);
  }

  // ============================================
  // CHECK SPECIFIC FIELDS (v89.6.6 schema additions)
  // ============================================
  console.log("\n📋 SCHEMA FIELDS CHECK (P0-2, P0-3, P1-2..5)");
  console.log("─".repeat(60));

  // users.is_active (P0-3)
  const userCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/users?select=is_active,last_login,login_count&limit=1`, authHeaders);
  if (userCheck.status === 200) {
    console.log(`   ✅ users.is_active, last_login, login_count EXISTS`);
  } else if (userCheck.status === 400) {
    console.log(`   ❌ users thiếu fields: ${userCheck.data?.message || "?"}`);
  } else {
    console.log(`   ⚠️  users check: ${userCheck.status}`);
  }

  // nha_cung_cap.han_muc (P1-2)
  const nccCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/nha_cung_cap?select=han_muc&limit=1`, authHeaders);
  if (nccCheck.status === 200) {
    console.log(`   ✅ nha_cung_cap.han_muc EXISTS`);
  } else {
    console.log(`   ❌ nha_cung_cap thiếu han_muc: ${nccCheck.data?.message || "?"}`);
  }

  // tasks.kieu_may (P1-3)
  const tasksCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/tasks?select=kieu_may,loai_san_pham,khoa&limit=1`, authHeaders);
  if (tasksCheck.status === 200) {
    console.log(`   ✅ tasks.kieu_may, loai_san_pham, khoa EXISTS`);
  } else {
    console.log(`   ❌ tasks thiếu fields: ${tasksCheck.data?.message || "?"}`);
  }

  // lenh_sx_tong.trang_thai (P1-4)
  const lsxCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/lenh_sx_tong?select=trang_thai,tien_do&limit=1`, authHeaders);
  if (lsxCheck.status === 200) {
    console.log(`   ✅ lenh_sx_tong.trang_thai, tien_do EXISTS`);
  } else {
    console.log(`   ❌ lenh_sx_tong thiếu fields: ${lsxCheck.data?.message || "?"}`);
  }

  // kho fields (P0-2)
  const khoCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/kho?select=don_gia,gia_tri,ngay_het_han,vi_tri_kho&limit=1`, authHeaders);
  if (khoCheck.status === 200) {
    console.log(`   ✅ kho.don_gia, gia_tri, ngay_het_han, vi_tri_kho EXISTS`);
  } else {
    console.log(`   ❌ kho thiếu fields: ${khoCheck.data?.message || "?"}`);
  }

  // cong_no fields (P0-2)
  const cnCheck = await fetchJson(`${SUPABASE_URL}/rest/v1/cong_no?select=ncc_id,loai_cong_no,da_thanh_toan,con_no&limit=1`, authHeaders);
  if (cnCheck.status === 200) {
    console.log(`   ✅ cong_no.ncc_id, loai_cong_no, da_thanh_toan, con_no EXISTS`);
  } else {
    console.log(`   ❌ cong_no thiếu fields: ${cnCheck.data?.message || "?"}`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "═".repeat(60));
  if (tablesMissing === 0) {
    console.log("🎉 SCHEMA READY! 10/10 tables + P0/P1 fields OK");
    console.log("═".repeat(60));
    console.log("\n📋 NEXT STEPS:");
    console.log("   1. Enable RLS (nếu chưa):");
    console.log("      → Vào Dashboard > Authentication > Policies");
    console.log("      → Hoặc chạy file supabase-migrations/003_enable_rls.sql (sẽ tạo)");
    console.log("   2. Apply seed data (optional):");
    console.log("      → Mở SQL Editor > chạy supabase-migrations/002_seed_data.sql");
    console.log("   3. Restart Next.js dev server để load env mới:");
    console.log("      → Ctrl+C rồi: cd apps/web && npm run dev");
    console.log("   4. Test auth: đăng nhập sang@mimin.vn / sang123");
    console.log("   5. Mở DevTools > Network > check request tới Supabase");
  } else {
    console.log(`⚠️  NEEDS MIGRATION: ${tablesMissing} tables missing`);
    console.log("═".repeat(60));
    console.log("\n📋 APPLY MIGRATIONS:");
    console.log("   → Chạy: node apply-migrations.js");
    console.log("   → Hoặc mở: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new");
    console.log("   → Copy nội dung file supabase-migrations/001_init_schema.sql");
    console.log("   → Paste vào SQL Editor > Click Run");
  }
  console.log();
})();

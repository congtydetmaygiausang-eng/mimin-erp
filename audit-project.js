// ============================================
// MIMIN ERP - Comprehensive Project Audit
// Chạy: node audit-project.js
// Output: Báo cáo chi tiết dự án (không in value env)
// ============================================

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const WEB = path.join(ROOT, "apps", "web");

const report = {
  timestamp: new Date().toISOString(),
  sections: [],
  issues: [],
  ok: [],
};

// ============================================
// HELPERS
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

function maskValue(v) {
  if (!v) return "(empty)";
  if (v.length <= 8) return "***";
  return v.slice(0, 4) + "***" + v.slice(-4) + " (" + v.length + " chars)";
}

function section(title) {
  console.log("\n" + "═".repeat(70));
  console.log("  " + title);
  console.log("═".repeat(70));
}

function subsection(title) {
  console.log("\n📌 " + title);
  console.log("─".repeat(70));
}

function ok(msg) { report.ok.push(msg); console.log("   ✅ " + msg); }
function warn(msg) { report.issues.push({ severity: "warn", msg }); console.log("   ⚠️  " + msg); }
function err(msg) { report.issues.push({ severity: "error", msg }); console.log("   ❌ " + msg); }
function info(msg) { console.log("   " + msg); }

// ============================================
// 1. FILE STRUCTURE
// ============================================
function checkStructure() {
  section("1. CẤU TRÚC DỰ ÁN");

  const requiredDirs = [
    "apps/web/src/app",
    "apps/web/src/components",
    "apps/web/src/lib",
    "apps/web/src/app/(main)",
    "apps/web/src/app/(auth)",
    "supabase-migrations",
  ];

  requiredDirs.forEach(d => {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) {
      const files = fs.readdirSync(full).length;
      ok(`${d} (${files} files/dirs)`);
    } else {
      err(`MISSING: ${d}`);
    }
  });

  // Count files
  const counts = {
    "TS/TSX files": 0,
    "JSON files": 0,
    "SQL files": 0,
    "MD files": 0,
  };

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
      if (f === "node_modules" || f === ".next" || f === "out" || f === ".git") return;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (f.endsWith(".ts") || f.endsWith(".tsx")) counts["TS/TSX files"]++;
      else if (f.endsWith(".json")) counts["JSON files"]++;
      else if (f.endsWith(".sql")) counts["SQL files"]++;
      else if (f.endsWith(".md")) counts["MD files"]++;
    });
  }

  walk(ROOT);
  subsection("File counts");
  Object.entries(counts).forEach(([k, v]) => info(`${k}: ${v}`));
}

// ============================================
// 2. PACKAGE.JSON
// ============================================
function checkPackageJson() {
  section("2. PACKAGE.JSON");

  const pkgPath = path.join(WEB, "package.json");
  if (!fs.existsSync(pkgPath)) {
    err("Missing apps/web/package.json");
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  ok(`Name: ${pkg.name}`);
  ok(`Version: ${pkg.version || "(none)"}`);

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const requiredDeps = [
    "next", "react", "react-dom", "@supabase/supabase-js",
    "lucide-react", "tailwindcss", "typescript",
  ];

  subsection("Critical dependencies");
  requiredDeps.forEach(dep => {
    if (deps[dep]) ok(`${dep}: ${deps[dep]}`);
    else warn(`Missing: ${dep}`);
  });

  // Total deps
  info(`Total dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
  info(`Total devDependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
}

// ============================================
// 3. ENV CONFIGURATION
// ============================================
function checkEnv() {
  section("3. ENV CONFIGURATION (.env.local)");

  const envPath = path.join(WEB, ".env.local");
  if (!fs.existsSync(envPath)) {
    err("Missing apps/web/.env.local");
    return;
  }
  ok(`.env.local exists (${(fs.statSync(envPath).size / 1024).toFixed(1)}KB)`);

  const env = loadEnv(envPath);
  const keys = Object.keys(env);

  const expected = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "DEEPSEEK_API_KEY",
    "MINIMAX_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ];

  subsection("Required keys");
  expected.forEach(k => {
    if (env[k]) {
      ok(`${k}: ${maskValue(env[k])}`);
    } else {
      err(`Missing: ${k}`);
    }
  });

  // Check for VITE_ keys (should be Next.js, not Vite)
  const viteKeys = keys.filter(k => k.startsWith("VITE_"));
  if (viteKeys.length > 0) {
    err(`Found ${viteKeys.length} VITE_ keys (Next.js cần NEXT_PUBLIC_, không phải VITE_)`);
    viteKeys.forEach(k => err(`  - ${k}`));
  } else {
    ok("No VITE_ keys (đúng chuẩn Next.js)");
  }

  // Check URL matches
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    if (url.includes("nftlwdcsmlpeiazhuoho")) {
      ok("Supabase URL matches project ref nftlwdcsmlpeiazhuoho");
    } else {
      warn(`Supabase URL khác: ${url} (expected nftlwdcsmlpeiazhuoho)`);
    }
  }

  info(`\n   Total env vars: ${keys.length}`);
}

// ============================================
// 4. SUPABASE MIGRATIONS
// ============================================
function checkMigrations() {
  section("4. SUPABASE MIGRATIONS");

  const migDir = path.join(ROOT, "supabase-migrations");
  if (!fs.existsSync(migDir)) {
    err("Missing supabase-migrations/");
    return;
  }
  const files = fs.readdirSync(migDir).filter(f => f.endsWith(".sql")).sort();
  files.forEach(f => {
    const full = path.join(migDir, f);
    const size = (fs.statSync(full).size / 1024).toFixed(1);
    ok(`${f} (${size}KB)`);
  });

  if (files.length === 0) err("No SQL files");

  // Check for common SQL issues
  files.forEach(f => {
    const content = fs.readFileSync(path.join(migDir, f), "utf8");
    const createTable = (content.match(/CREATE TABLE/g) || []).length;
    const createIndex = (content.match(/CREATE INDEX/g) || []).length;
    const enableRLS = (content.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
    const createPolicy = (content.match(/CREATE POLICY/g) || []).length;
    info(`  ${f}: ${createTable} tables, ${createIndex} indexes, ${enableRLS} RLS, ${createPolicy} policies`);
  });
}

// ============================================
// 5. NEXT.JS ROUTES (pages)
// ============================================
function checkRoutes() {
  section("5. NEXT.JS ROUTES");

  const pagesDir = path.join(WEB, "src", "app");
  if (!fs.existsSync(pagesDir)) {
    err("Missing src/app");
    return;
  }

  const routes = [];
  function walk(dir, base = "") {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (f.startsWith("(") || f.startsWith("[")) {
          walk(full, base);
        } else {
          walk(full, base + "/" + f);
        }
      } else if (f === "page.tsx" || f === "page.ts") {
        routes.push(base || "/");
      }
    });
  }
  walk(pagesDir);

  // Group by group
  const groups = {};
  routes.forEach(r => {
    const grp = r.includes("/(main)/") ? "(main)" :
                r.includes("/(auth)/") ? "(auth)" : "root";
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(r);
  });

  Object.entries(groups).forEach(([g, rs]) => {
    ok(`Group ${g}: ${rs.length} routes`);
  });
  info(`Total: ${routes.length} routes`);

  // Sample
  subsection("Sample routes");
  routes.slice(0, 8).forEach(r => info(`  ${r}`));
  if (routes.length > 8) info(`  ... +${routes.length - 8} more`);
}

// ============================================
// 6. KEY LIB FILES
// ============================================
function checkLibFiles() {
  section("6. KEY LIB FILES (v89.6.6 - v89.6.8)");

  const libDir = path.join(WEB, "src", "lib");
  if (!fs.existsSync(libDir)) {
    err("Missing src/lib");
    return;
  }

  const keyFiles = [
    "users.ts",                              // canonical 26 users
    "workflow-data.ts",                      // PhieuWorkflow
    "real-workflow-data.ts",                 // 32 phiếu thật
    "more-workflow-data.ts",                 // 3 phiếu bổ sung
    "master-data-full.ts",                   // 16 NCC + 12 KH
    "cong-no-engine.ts",                     // 3 hàm công nợ
    "kho-vai-tinhmann.ts",                   // kho vải
    "kho-soi-day-chuyen.ts",                 // kho sợi
    "kho-phu-lieu.ts",                       // kho phụ liệu
    "mau-vai-35.ts",                         // 35 màu vải
    "bang-luong-engine.ts",                  // tính lương
    "canh-bao-engine.ts",                    // cảnh báo
    "yarn-production-chain.ts",              // công thức sợi
    "security.ts",                           // rate-limit + TTL
    "two-factor.ts",                         // 2FA
    "lark-config.ts",                        // unified lark
    "migrate-legacy-keys.ts",                // auto-migrate
    "supabase/client.ts",                    // supabase config
  ];

  keyFiles.forEach(f => {
    const full = path.join(libDir, f);
    if (fs.existsSync(full)) {
      const size = (fs.statSync(full).size / 1024).toFixed(1);
      ok(`${f} (${size}KB)`);
    } else {
      warn(`Missing: src/lib/${f}`);
    }
  });
}

// ============================================
// 7. KEY COMPONENTS
// ============================================
function checkComponents() {
  section("7. KEY COMPONENTS");

  const compDir = path.join(WEB, "src", "components");
  if (!fs.existsSync(compDir)) {
    err("Missing src/components");
    return;
  }

  const keyComps = [
    "session-provider.tsx",
    "NewOrderModal.tsx",
    "UpdateSLModal.tsx",
    "GlobalSearch.tsx",
    "ColorPicker.tsx",
    "PageGuard.tsx",
  ];

  keyComps.forEach(f => {
    const full = path.join(compDir, f);
    if (fs.existsSync(full)) {
      const size = (fs.statSync(full).size / 1024).toFixed(1);
      ok(`${f} (${size}KB)`);
    } else {
      warn(`Missing: src/components/${f}`);
    }
  });
}

// ============================================
// 8. KEY PAGES (v89.6.x features)
// ============================================
function checkKeyPages() {
  section("8. KEY PAGES (v89.6.x)");

  const mainDir = path.join(WEB, "src", "app", "(main)");
  const authDir = path.join(WEB, "src", "app", "(auth)");

  const keyPages = [
    ["(main)", "lenh-cat", "Lệnh cắt"],
    ["(main)", "kho-thanh-pham", "Kho thành phẩm"],
    ["(main)", "bang-luong-auto", "Bảng lương auto"],
    ["(main)", "seed-data", "Seed data"],
    ["(main)", "test-kiem-thu", "Test 54 modules"],
    ["(main)", "test-phan-quyen", "Test phân quyền"],
    ["(main)", "backup-restore", "Backup/Restore"],
    ["(auth)", "ui-cat", "UI Cắt"],
    ["(auth)", "ui-khuy-nut", "UI Khuy nút"],
    ["(auth)", "ui-ui", "UI Ủi"],
    ["(auth)", "ui-dong-goi", "UI Đóng gói"],
  ];

  keyPages.forEach(([group, name, label]) => {
    const dir = group === "(main)" ? mainDir : authDir;
    const full = path.join(dir, name, "page.tsx");
    if (fs.existsSync(full)) {
      ok(`${label} (/${name}/)`);
    } else {
      warn(`Missing: /${name}/ - ${label}`);
    }
  });
}

// ============================================
// 9. TYPESCRIPT CHECK (try build)
// ============================================
function checkTypeScript() {
  section("9. TYPESCRIPT");

  const tsConfig = path.join(WEB, "tsconfig.json");
  if (!fs.existsSync(tsConfig)) {
    err("Missing tsconfig.json");
    return;
  }
  ok("tsconfig.json exists");

  try {
    info("Running tsc --noEmit (chỉ check types, không build)...");
    const out = execSync("cd apps/web && npx tsc --noEmit 2>&1", {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 90000,
    });
    if (out.trim()) {
      warn("TypeScript warnings (xem trên)");
      console.log(out.split("\n").slice(0, 10).map(l => "   " + l).join("\n"));
    } else {
      ok("TypeScript: 0 errors");
    }
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    const errorLines = out.split("\n").filter(l => l.includes("error TS")).length;
    err(`TypeScript: ${errorLines} errors`);
    console.log(out.split("\n").slice(0, 15).map(l => "   " + l).join("\n"));
  }
}

// ============================================
// 10. GIT STATUS (if repo)
// ============================================
function checkGit() {
  section("10. GIT STATUS");

  if (!fs.existsSync(path.join(ROOT, ".git"))) {
    info("Not a git repo (OK for now)");
    return;
  }
  ok("Git repo exists");

  try {
    const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
    info(`Branch: ${branch}`);
    const status = execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
    const changes = status.split("\n").filter(l => l.trim()).length;
    if (changes > 0) {
      warn(`${changes} uncommitted changes`);
    } else {
      ok("Working tree clean");
    }

    // Check .gitignore
    const gitignore = path.join(ROOT, ".gitignore");
    if (fs.existsSync(gitignore)) {
      const content = fs.readFileSync(gitignore, "utf8");
      if (content.includes(".env") || content.includes(".env.local")) {
        ok(".env in .gitignore");
      } else {
        err(".env NOT in .gitignore - SECURITY RISK");
      }
    } else {
      warn("No .gitignore");
    }
  } catch (e) {
    info("Git not available or error: " + e.message);
  }
}

// ============================================
// SUMMARY
// ============================================
function summary() {
  section("📊 SUMMARY");
  const errors = report.issues.filter(i => i.severity === "error").length;
  const warnings = report.issues.filter(i => i.severity === "warn").length;
  const oks = report.ok.length;

  console.log(`   ✅ Passed:   ${oks}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Errors:   ${errors}`);

  if (errors === 0 && warnings === 0) {
    console.log("\n   🎉 PERFECT! Dự án hoàn hảo, sẵn sàng production.");
  } else if (errors === 0) {
    console.log("\n   👍 Tốt! Có " + warnings + " warnings nhỏ, không nghiêm trọng.");
  } else {
    console.log("\n   🚨 Cần fix " + errors + " lỗi trước khi chạy:");
    report.issues.filter(i => i.severity === "error").forEach(i => {
      console.log(`      - ${i.msg}`);
    });
  }

  console.log("\n📋 NEXT STEPS:");
  if (!fs.existsSync(path.join(WEB, ".env.local"))) {
    console.log("   1. Tạo apps/web/.env.local với 9 keys");
  } else {
    console.log("   1. ✅ .env.local OK");
  }
  if (errors > 0) {
    console.log("   2. Fix " + errors + " lỗi ở trên");
  } else {
    console.log("   2. Apply Supabase migrations (xem HUONG_DAN_APPLY_SUPABASE.md)");
  }
  console.log("   3. cd apps/web && npm run dev");
  console.log("   4. Test http://localhost:3000");
  console.log();
}

// ============================================
// RUN ALL
// ============================================
console.log("\n🔍 MIMIN ERP - COMPREHENSIVE PROJECT AUDIT");
console.log("═".repeat(70));
console.log("   " + report.timestamp);
console.log("═".repeat(70));

try { checkStructure(); } catch (e) { err("Structure check failed: " + e.message); }
try { checkPackageJson(); } catch (e) { err("Package check failed: " + e.message); }
try { checkEnv(); } catch (e) { err("Env check failed: " + e.message); }
try { checkMigrations(); } catch (e) { err("Migration check failed: " + e.message); }
try { checkRoutes(); } catch (e) { err("Routes check failed: " + e.message); }
try { checkLibFiles(); } catch (e) { err("Lib check failed: " + e.message); }
try { checkComponents(); } catch (e) { err("Components check failed: " + e.message); }
try { checkKeyPages(); } catch (e) { err("Pages check failed: " + e.message); }
try { checkGit(); } catch (e) { info("Git check skipped: " + e.message); }
// TypeScript cuối cùng vì chậm nhất
try { checkTypeScript(); } catch (e) { err("TypeScript check failed: " + e.message); }

summary();

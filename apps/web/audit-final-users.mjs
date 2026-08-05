// Audit tổng user @mimin.vn: 1 admin + 22 NV + 20 NCC = 43 user
// So sánh auth.users vs users (custom) - check mọi user đều có cả 2 bảng
// 2026-08-05 - Mavis
import { readFileSync, existsSync } from "node:fs";

const envPath = "D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/.env.local";
if (!existsSync(envPath)) {
  console.error("❌ Khong tim thay .env.local");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return idx > 0 ? [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "")] : null;
    })
    .filter(Boolean)
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";

async function sqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`SQL ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("🔍 AUDIT TONG USER @mimin.vn (sau khi sync 22 NV + 20 NCC)\n");

  // 1. Bang users (custom) - tat ca user
  const users = await sqlQuery(`
    SELECT id, email, name, role, "chucVu", "phongBan", "isActive"
    FROM users
    ORDER BY role, email
  `);

  // 2. auth.users - tat ca user
  const auth = await sqlQuery(`
    SELECT id, email, raw_app_meta_data->>'role' AS role
    FROM auth.users
    ORDER BY email
  `);

  // 3. Loc chi user @mimin.vn
  const miminUsers = users.filter((u) => u.email?.endsWith("@mimin.vn"));
  const miminAuth = auth.filter((a) => a.email?.endsWith("@mimin.vn"));

  console.log("=".repeat(80));
  console.log(`📊 TONG USER: ${users.length} trong bang users | ${auth.length} trong auth.users`);
  console.log(`📊 USER @mimin.vn: ${miminUsers.length} trong bang users | ${miminAuth.length} trong auth.users`);
  console.log("=".repeat(80));

  // Stats theo role
  const byRole = {};
  for (const u of miminUsers) {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
  }
  console.log("\n📈 THONG KE THEO ROLE (bang users):");
  for (const [role, count] of Object.entries(byRole)) {
    console.log(`   - ${role.padEnd(15)}: ${count} user`);
  }

  // So sánh auth vs users
  const userEmails = new Set(miminUsers.map((u) => u.email));
  const authEmails = new Set(miminAuth.map((a) => a.email));
  const inUsersNotAuth = miminUsers.filter((u) => !authEmails.has(u.email));
  const inAuthNotUsers = miminAuth.filter((a) => !userEmails.has(a.email));

  console.log(`\n🔄 DOI CHIEU auth.users ↔ bang users:`);
  if (inUsersNotAuth.length === 0 && inAuthNotUsers.length === 0) {
    console.log(`   ✅ KHOP 100% - ${miminUsers.length} user deu co ca 2 ben`);
  } else {
    if (inUsersNotAuth.length > 0) {
      console.log(`   ⚠️ Co trong users nhung KHONG co trong auth (${inUsersNotAuth.length}):`);
      for (const u of inUsersNotAuth) console.log(`      - ${u.email}`);
    }
    if (inAuthNotUsers.length > 0) {
      console.log(`   ⚠️ Co trong auth nhung KHONG co trong users (${inAuthNotUsers.length}):`);
      for (const a of inAuthNotUsers) console.log(`      - ${a.email}`);
    }
  }

  // Chi tiet tung role
  console.log("\n📋 CHI TIET @mimin.vn:");
  const roles = ["admin", "planner", "accountant", "content", "warehouse", "sewing", "finishing", "partner"];
  for (const role of roles) {
    const list = miminUsers.filter((u) => u.role === role);
    if (list.length > 0) {
      console.log(`\n   [${role.toUpperCase()}] - ${list.length} user:`);
      for (const u of list) {
        const hasAuth = authEmails.has(u.email) ? "✅" : "❌";
        console.log(`      ${hasAuth} ${u.email.padEnd(28)} ${u.name} - ${u.chucVu}`);
      }
    }
  }

  // Check user cũ còn sót
  const oldStill = users.filter((u) => !u.email?.endsWith("@mimin.vn"));
  const oldStillAuth = auth.filter((a) => !a.email?.endsWith("@mimin.vn"));
  console.log(`\n🗑️  USER CU CON SOT:`);
  console.log(`   - Bang users: ${oldStill.length}`);
  for (const u of oldStill) console.log(`      ❌ ${u.email}`);
  console.log(`   - auth.users: ${oldStillAuth.length}`);
  for (const a of oldStillAuth) console.log(`      ❌ ${a.email}`);

  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ HOAN THANH audit`);
  console.log(`${"=".repeat(80)}`);
}
main().catch((e) => { console.error("💥", e.message); process.exit(1); });

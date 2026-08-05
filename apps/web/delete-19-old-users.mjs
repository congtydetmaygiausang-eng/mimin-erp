// Xoa 19 user CU (admin@mimin.com + 18 @gmail.com/@mimin-erp.local)
// GIU LAI: tat ca user @mimin.vn (sang + 22 NV moi + 20 NCC)
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
const SECRET_KEY = env.SUPABASE_SECRET_KEY;
const PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error("❌ Missing SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}

async function sqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`SQL ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteAuthUser(id) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${SECRET_KEY}`, "apikey": SECRET_KEY },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Auth DELETE ${res.status}: ${text}`);
  }
  return res.status;
}

async function main() {
  console.log("🔍 Tim user CU (khong phai @mimin.vn) trong auth.users + bang users...\n");

  // 1. Lay user cu trong auth.users
  const oldAuth = await sqlQuery(`
    SELECT id, email FROM auth.users
    WHERE email NOT LIKE '%@mimin.vn'
    ORDER BY email
  `);
  console.log(`📊 auth.users co ${oldAuth.length} user CU:`);
  for (const u of oldAuth) console.log(`   - ${u.email}`);

  // 2. Lay user cu trong bang users (custom)
  const oldUsers = await sqlQuery(`
    SELECT id, email, role FROM users
    WHERE email NOT LIKE '%@mimin.vn'
    ORDER BY email
  `);
  console.log(`\n📊 Bang users co ${oldUsers.length} user CU:`);
  for (const u of oldUsers) console.log(`   - [${u.role}] ${u.email}`);

  if (oldAuth.length === 0 && oldUsers.length === 0) {
    console.log("\n✅ Khong co user CU can xoa. He thong da sach!");
    return;
  }

  // 3. Xoa trong bang users truoc (tranh FK conflict voi audit_logs, push_subs...)
  console.log("\n⏳ Buoc 1: Xoa trong bang users (custom)...");
  for (const u of oldUsers) {
    try {
      await sqlQuery(`DELETE FROM users WHERE id = '${u.id}'`);
      console.log(`   ✅ Deleted users: ${u.email}`);
    } catch (e) {
      console.log(`   ❌ Failed users: ${u.email} - ${e.message.slice(0, 100)}`);
    }
  }

  // 4. Xoa trong auth.users
  console.log("\n⏳ Buoc 2: Xoa trong auth.users...");
  for (const u of oldAuth) {
    try {
      const status = await deleteAuthUser(u.id);
      console.log(`   ✅ Deleted auth: ${u.email} (status ${status})`);
    } catch (e) {
      console.log(`   ❌ Failed auth: ${u.email} - ${e.message.slice(0, 100)}`);
    }
  }

  // 5. Verify final state
  console.log("\n📊 TRANG THAI CUOI:");
  const finalAuth = await sqlQuery(`SELECT email, raw_app_meta_data->>'role' AS role FROM auth.users ORDER BY email`);
  const finalUsers = await sqlQuery(`SELECT email, role, "phongBan" FROM users ORDER BY role, email`);

  console.log(`\n   auth.users: ${finalAuth.length} user`);
  for (const u of finalAuth) console.log(`   - [${(u.role || "null").padEnd(10)}] ${u.email}`);

  console.log(`\n   users (custom): ${finalUsers.length} user`);
  for (const u of finalUsers) console.log(`   - [${u.role.padEnd(10)}] ${u.email.padEnd(25)} ${u.phongBan}`);

  // Stats
  const miminAuth = finalAuth.filter((u) => u.email.endsWith("@mimin.vn")).length;
  const miminUsers = finalUsers.filter((u) => u.email.endsWith("@mimin.vn")).length;
  console.log(`\n📈 @mimin.vn: ${miminAuth} trong auth.users, ${miminUsers} trong bang users`);
  console.log(`\n🎉 Xong! Toan bo ${oldAuth.length} user CU da xoa.`);
  console.log(`   Con lai: 1 admin (sang@mimin.vn) + 22 NV + 20 NCC = 43 user @mimin.vn`);
}
main().catch((e) => { console.error("💥", e.message); process.exit(1); });

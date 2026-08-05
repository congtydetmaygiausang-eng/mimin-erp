// Tao user sang@mimin.vn trong Supabase Auth (GoTrue Admin API)
// Sau do update bang users de match id
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

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error("❌ Missing SUPABASE_URL hoặc SUPABASE_SECRET_KEY");
  process.exit(1);
}

async function sqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/ejcuqyaiwabfygyesvxj/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`SQL HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function createAuthUser(email, password, name) {
  // GoTrue Admin API: POST /auth/v1/admin/users
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SECRET_KEY}`,
      "apikey": SECRET_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "admin" },
      app_metadata: { role: "admin" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoTrue HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

const NEW_EMAIL = "sang@mimin.vn";
const NEW_PASSWORD = "sang123";
const NEW_NAME = "Hồ Minh Sang";

async function main() {
  console.log(`🔍 Kiem tra user ${NEW_EMAIL} trong auth.users...`);
  const existing = await sqlQuery(`SELECT id, email FROM auth.users WHERE email = '${NEW_EMAIL}'`);

  let authUserId;

  if (Array.isArray(existing) && existing.length > 0) {
    authUserId = existing[0].id;
    console.log(`ℹ️ User da ton tai: ${authUserId}`);
  } else {
    console.log("⏳ Tao moi user trong auth.users (qua GoTrue Admin API)...");
    const created = await createAuthUser(NEW_EMAIL, NEW_PASSWORD, NEW_NAME);
    authUserId = created.id;
    console.log(`✅ Da tao user: ${authUserId}`);
  }

  // Verify role trong auth.users
  const verify = await sqlQuery(
    `SELECT id, email, raw_app_meta_data->>'role' AS role FROM auth.users WHERE id = '${authUserId}'`
  );
  console.log("");
  console.log("🔍 Verify user trong auth.users:");
  console.log(JSON.stringify(verify[0], null, 2));

  // Cap nhat bang users (custom)
  console.log("");
  console.log("🔍 Kiem tra bang users (custom)...");
  const userRecord = await sqlQuery(`SELECT id, email, role FROM users WHERE email = '${NEW_EMAIL}'`);

  if (Array.isArray(userRecord) && userRecord.length > 0) {
    const current = userRecord[0];
    if (current.id !== authUserId) {
      console.log(`⚠️ ID khong khop: ${current.id} vs ${authUserId}`);
      console.log("⏳ Update users.id...");
      await sqlQuery(`UPDATE users SET id = '${authUserId}', "updated_at" = NOW() WHERE email = '${NEW_EMAIL}'`);
      console.log("✅ Da update");
    } else {
      console.log("ℹ️ ID da khop, ok");
    }
  } else {
    console.log("⏳ Tao moi record trong users...");
    await sqlQuery(
      `INSERT INTO users (id, email, name, role, "chucVu", "phongBan", "isActive", "created_at", "updated_at")
       VALUES ('${authUserId}', '${NEW_EMAIL}', '${NEW_NAME.replace(/'/g, "''")}', 'admin', 'Quản trị hệ thống', 'ban-giam-doc', true, NOW(), NOW())`
    );
    console.log("✅ Da tao moi");
  }

  // Final verify
  const final = await sqlQuery(`
    SELECT u.id, u.email, u.name, u.role, au.id::text AS auth_id
    FROM users u LEFT JOIN auth.users au ON au.id::text = u.id
    WHERE u.email = '${NEW_EMAIL}'
  `);
  console.log("");
  console.log("✅ KET QUA CUOI CUNG:");
  console.log(JSON.stringify(final[0], null, 2));

  console.log("");
  console.log("🎉 XONG! Sep co the dang nhap bang:");
  console.log(`   Email:    ${NEW_EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log("");
  console.log("   F5 trang → dang nhap → se co quyen admin day du!");
}

main().catch((err) => {
  console.error("💥 Loi:", err.message);
  process.exit(1);
});

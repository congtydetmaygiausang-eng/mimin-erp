// Sync 11 user MỚI theo list sếp Sang (32 = 11 mới + 21 cũ)
// 2026-08-05 - Mavis
import { readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")] : null; })
    .filter(Boolean)
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = env.SUPABASE_SECRET_KEY;
const PAT = process.env.SUPABASE_PAT;

const PROJECT_REF = "ejcuqyaiwabfygyesvxj";

const NEW_USERS = [
  { email: "sang@mimin.vn",   password: "sang123",     name: "Anh Sang",      role: "admin",     chucVu: "Quản trị",            phongBan: "ban-giam-doc" },
  { email: "giau@mimin.vn",   password: "Mimin@123",   name: "Chị Giàu",      role: "planner",   chucVu: "Điều hành",           phongBan: "ban-dieu-hanh" },
  { email: "thanh@mimin.vn",  password: "Mimin@123",   name: "Bùi Thị Thanh", role: "accountant",chucVu: "Kế toán + Điều phối",  phongBan: "ban-ke-toan" },
  { email: "huyen@mimin.vn",  password: "Mimin@123",   name: "Đỗ Thị Huyền", role: "planner",   chucVu: "Bán sỉ",              phongBan: "ban-ban-si" },
  { email: "vy@mimin.vn",     password: "Mimin@123",   name: "Cẩm Vy",       role: "content",   chucVu: "Content - Media",      phongBan: "ban-content" },
  { email: "hau@mimin.vn",    password: "Mimin@123",   name: "Quốc Hậu",     role: "warehouse", chucVu: "Thủ kho trưởng",      phongBan: "ban-kho" },
  { email: "giang@mimin.vn",  password: "Mimin@123",   name: "Giang",         role: "sewing",    chucVu: "Tổ trưởng Cắt",       phongBan: "to-cat" },
  { email: "de@mimin.vn",     password: "Mimin@123",   name: "Đệ",           role: "sewing",    chucVu: "CN Cắt",               phongBan: "to-cat" },
  { email: "phu@mimin.vn",    password: "Mimin@123",   name: "Phú",           role: "sewing",    chucVu: "CN Cắt hỗ trợ",       phongBan: "to-cat" },
  { email: "ruong@mimin.vn",  password: "Mimin@123",   name: "Ruộng",         role: "sewing",    chucVu: "Tổ trưởng Khuy nút",  phongBan: "to-khuy-nut" },
];

async function sqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`SQL ${res.status}: ${await res.text()}`);
  return res.json();
}

async function createAuthUser(u) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SECRET_KEY}`,
      "apikey": SECRET_KEY,
    },
    body: JSON.stringify({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role },
      app_metadata: { role: u.role },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("already") || text.includes("duplicate")) return null;
    throw new Error(`Auth ${res.status}: ${text}`);
  }
  return res.json();
}

async function upsertUser(u, authId) {
  await sqlQuery(`
    INSERT INTO users (id, email, name, role, "chucVu", "phongBan", "isActive", "created_at", "updated_at")
    VALUES ('${authId}', '${u.email}', '${u.name.replace(/'/g, "''")}', '${u.role}', '${u.chucVu.replace(/'/g, "''")}', '${u.phongBan}', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
      "chucVu" = EXCLUDED."chucVu", "phongBan" = EXCLUDED."phongBan", "updated_at" = NOW()
  `);
}

async function main() {
  console.log("🔄 Sync 10 user MỚI với email @mimin.vn (sang đã có)\n");

  let created = 0, updated = 0, failed = 0;

  for (const u of NEW_USERS) {
    try {
      const authUser = await createAuthUser(u);
      if (authUser) {
        await upsertUser(u, authUser.id);
        console.log(`✅ CREATED  ${u.email.padEnd(20)} ${u.name.padEnd(20)} (id: ${authUser.id.slice(0, 8)}...)`);
        created++;
      } else {
        const existing = await sqlQuery(`SELECT id FROM auth.users WHERE email = '${u.email}'`);
        if (existing.length > 0) {
          await upsertUser(u, existing[0].id);
          console.log(`🔄 UPDATED  ${u.email.padEnd(20)} ${u.name.padEnd(20)} (id: ${existing[0].id.slice(0, 8)}...)`);
          updated++;
        }
      }
    } catch (e) {
      console.log(`❌ FAILED   ${u.email} - ${e.message.slice(0, 80)}`);
      failed++;
    }
  }

  const final = await sqlQuery(`SELECT email, name, role FROM users WHERE email LIKE '%@mimin.vn' ORDER BY role, email`);
  console.log(`\n📊 Verify: Tong user @mimin.vn: ${final.length}`);
  for (const u of final) {
    console.log(`   [${u.role.padEnd(10)}] ${u.email.padEnd(20)} ${u.name}`);
  }

  console.log(`\n📈 STATS: Created ${created}, Updated ${updated}, Failed ${failed}`);
  console.log("\n🎉 Sếp login các TK @mimin.vn với password 'Mimin@123' (trừ 'sang' dùng 'sang123')");
}
main().catch((e) => { console.error("💥", e.message); process.exit(1); });

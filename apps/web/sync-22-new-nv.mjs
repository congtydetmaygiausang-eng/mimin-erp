// Sync 22 user NV moi voi email @mimin.vn
// - 9 user chinh tu danh sach sep Sang cung cap (bo qua sang da co)
// - 13 user tu users.ts (them vao de day du 18 NV + 1 admin)
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

// 22 user moi: 9 tu danh sach chinh (bo qua sang) + 13 tu users.ts
const NEW_NV = [
  // 9 user chinh (sang da co trong Auth)
  { id: "giau",     email: "giau@mimin.vn",   name: "Nguyễn Thị Giàu",   role: "planner",   chucVu: "Điều hành sản xuất",     phongBan: "ban-dieu-hanh" },
  { id: "thanh",    email: "thanh@mimin.vn",  name: "Bùi Thị Thanh",     role: "accountant",chucVu: "Kế toán + Điều phối SX", phongBan: "ban-ke-toan" },
  { id: "huyen",    email: "huyen@mimin.vn",  name: "Đỗ Thị Huyền",      role: "planner",   chucVu: "QL Khách hàng Sỉ",       phongBan: "ban-ban-si" },
  { id: "vy",       email: "vy@mimin.vn",     name: "Nguyễn Ngọc Cẩm Vy",role: "content",   chucVu: "Content - Media",         phongBan: "ban-content" },
  { id: "hau",      email: "hau@mimin.vn",    name: "Nguyễn Quốc Hậu",   role: "warehouse", chucVu: "Thủ kho trưởng",         phongBan: "ban-kho" },
  { id: "giang",    email: "giang@mimin.vn",  name: "Phan Văn Giang",    role: "sewing",    chucVu: "Tổ trưởng Cắt",          phongBan: "to-cat" },
  { id: "de",       email: "de@mimin.vn",     name: "Phạm Văn Đệ",       role: "sewing",    chucVu: "CN Cắt",                  phongBan: "to-cat" },
  { id: "phu",      email: "phu@mimin.vn",    name: "Nguyễn Văn Phú",    role: "sewing",    chucVu: "CN Cắt hỗ trợ",          phongBan: "to-cat" },
  { id: "ruong",    email: "ruong@mimin.vn",  name: "Nguyễn Văn Ruộng",  role: "sewing",    chucVu: "Tổ trưởng Khuy nút",     phongBan: "to-khuy-nut" },

  // 13 user them tu users.ts
  { id: "nhi",      email: "nhi@mimin.vn",    name: "Nguyễn Thị Mỹ Nhi", role: "finishing", chucVu: "Hoàn thiện (Gấp xếp)",   phongBan: "to-hoan-thien" },
  { id: "phuong",   email: "phuong@mimin.vn", name: "Võ Thị Phượng",     role: "finishing", chucVu: "Hoàn thiện (Gấp xếp)",   phongBan: "to-hoan-thien" },
  { id: "be",       email: "be@mimin.vn",     name: "Nguyễn Thị Bé",     role: "finishing", chucVu: "Hoàn thiện (Gấp xếp)",   phongBan: "to-hoan-thien" },
  { id: "hoa",      email: "hoa@mimin.vn",    name: "Huỳnh Xuân Hòa",    role: "admin",     chucVu: "Trợ lý admin (Media)",   phongBan: "ban-hanh-chinh" },
  { id: "duc1",     email: "duc1@mimin.vn",   name: "Nguyễn Minh Đức",   role: "finishing", chucVu: "Hoàn thiện (Ủi)",         phongBan: "to-hoan-thien" },
  { id: "tam",      email: "tam@mimin.vn",    name: "Trương Minh Tâm",   role: "finishing", chucVu: "Hoàn thiện (Ủi)",         phongBan: "to-hoan-thien" },
  { id: "dinh",     email: "dinh@mimin.vn",   name: "Lê Đỉnh",           role: "finishing", chucVu: "Hoàn thiện (Ủi)",         phongBan: "to-hoan-thien" },
  { id: "vinh",     email: "vinh@mimin.vn",   name: "Dương Tấn Vĩnh",    role: "sewing",    chucVu: "CN Cắt",                  phongBan: "to-cat" },
  { id: "minh1",    email: "minh1@mimin.vn",  name: "Nguyễn Quốc Minh",  role: "sewing",    chucVu: "CN Cắt",                  phongBan: "to-cat" },
  { id: "nhan",     email: "nhan@mimin.vn",   name: "Trương Văn Nhẫn",   role: "sewing",    chucVu: "CN Cắt",                  phongBan: "to-cat" },
  { id: "phi",      email: "phi@mimin.vn",    name: "Lương Hoàng Phi",   role: "admin",     chucVu: "Media",                   phongBan: "ban-content" },
  { id: "vy2",      email: "vy2@mimin.vn",    name: "Vy Phòng Kho",      role: "warehouse", chucVu: "NV Kho phụ",              phongBan: "ban-kho" },
  { id: "thanh2",   email: "thanh2@mimin.vn", name: "Thanh Phòng Cắt",   role: "sewing",    chucVu: "CN Cắt (HT2)",            phongBan: "to-cat" },
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
      password: u.password || "Mimin@123",
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
    VALUES ('${authId}', '${u.email}', '${u.name.replace(/'/g, "''")}', '${u.role}',
            '${u.chucVu.replace(/'/g, "''")}', '${u.phongBan}', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
      "chucVu" = EXCLUDED."chucVu", "phongBan" = EXCLUDED."phongBan", "updated_at" = NOW()
  `);
}

async function main() {
  console.log("🔄 Sync 22 user NV moi voi email @mimin.vn\n");

  let c = 0, u = 0, f = 0;
  for (const usr of NEW_NV) {
    try {
      const auth = await createAuthUser(usr);
      if (auth) {
        await upsertUser(usr, auth.id);
        console.log(`✅ CREATED  ${usr.email.padEnd(20)} [${usr.role.padEnd(10)}] ${usr.name}`);
        c++;
      } else {
        const ex = await sqlQuery(`SELECT id FROM auth.users WHERE email = '${usr.email}'`);
        if (ex.length > 0) {
          await upsertUser(usr, ex[0].id);
          console.log(`🔄 UPDATED  ${usr.email.padEnd(20)} [${usr.role.padEnd(10)}] ${usr.name}`);
          u++;
        }
      }
    } catch (e) {
      console.log(`❌ FAILED   ${usr.email} - ${e.message.slice(0, 100)}`);
      f++;
    }
  }

  console.log(`\n📈 STATS: Created ${c}, Updated ${u}, Failed ${f}`);

  // Verify tong @mimin.vn
  const final = await sqlQuery(`
    SELECT email, name, role, "phongBan"
    FROM users
    WHERE email LIKE '%@mimin.vn' AND role != 'partner'
    ORDER BY role, email
  `);
  console.log(`\n📊 TONG user NV @mimin.vn (khong tinh NCC): ${final.length}`);
  for (const u of final) {
    console.log(`   [${u.role.padEnd(10)}] ${u.email.padEnd(20)} ${u.name} - ${u.phongBan}`);
  }

  console.log("\n🎉 Sếp login các TK @mimin.vn với password 'Mimin@123' (trừ 'sang' dùng 'sang123')");
}
main().catch((e) => { console.error("💥", e.message); process.exit(1); });

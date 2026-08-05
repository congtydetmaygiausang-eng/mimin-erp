// Sync 20 user NCC gia cong may (role=partner) tu bang nha_cung_cap
// Email pattern: gc-{ma_ncc}@mimin.vn
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

async function createAuthUser(email, password, name, role) {
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
      user_metadata: { full_name: name, role },
      app_metadata: { role },
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
  console.log("🔍 Lay 20 NCC gia cong may tu bang nha_cung_cap...\n");

  // Lay 20 NCC gia cong, loai bo nhung NCC da co user
  const nccs = await sqlQuery(`
    SELECT id, ma_ncc, ten_ncc, nguoi_lh, sdt, loai_ncc, chuc_nang
    FROM nha_cung_cap
    WHERE ma_ncc LIKE 'GC-%' AND trang_thai = 'Đang hợp tác'
    ORDER BY ma_ncc
  `);

  if (!nccs || nccs.length === 0) {
    console.error("❌ Khong tim thay NCC gia cong trong nha_cung_cap!");
    process.exit(1);
  }

  console.log(`📊 Tim thay ${nccs.length} NCC gia cong may\n`);

  let c = 0, u = 0, f = 0;
  for (const n of nccs) {
    // Tao email: gc-{ma_ncc lowercase}@mimin.vn
    const emailRaw = `gc-${n.ma_ncc.toLowerCase()}@mimin.vn`;
    const name = n.nguoi_lh && n.nguoi_lh.trim() ? n.nguoi_lh.trim() : n.ten_ncc;
    const usr = {
      email: emailRaw,
      password: "Mimin@123",
      name,
      role: "partner",
      chucVu: `Đối tác gia công - ${n.ma_ncc} (${n.chuc_nang || n.loai_ncc || "Gia công"})`,
      phongBan: "doi-tac",
    };

    try {
      const auth = await createAuthUser(usr.email, usr.password, usr.name, usr.role);
      if (auth) {
        await upsertUser(usr, auth.id);
        console.log(`✅ CREATED  ${usr.email.padEnd(30)} [partner] ${usr.name.padEnd(25)} ← ${n.ma_ncc} ${n.ten_ncc}`);
        c++;
      } else {
        const ex = await sqlQuery(`SELECT id FROM auth.users WHERE email = '${usr.email}'`);
        if (ex.length > 0) {
          await upsertUser(usr, ex[0].id);
          console.log(`🔄 UPDATED  ${usr.email.padEnd(30)} [partner] ${usr.name.padEnd(25)} ← ${n.ma_ncc}`);
          u++;
        }
      }
    } catch (e) {
      console.log(`❌ FAILED   ${usr.email} - ${e.message.slice(0, 100)}`);
      f++;
    }
  }

  console.log(`\n📈 NCC STATS: Created ${c}, Updated ${u}, Failed ${f}`);

  // Verify
  const partners = await sqlQuery(`
    SELECT email, name, "chucVu"
    FROM users
    WHERE role = 'partner'
    ORDER BY email
  `);
  console.log(`\n📊 TONG user NCC (partner): ${partners.length}`);
  for (const p of partners) {
    console.log(`   [partner] ${p.email.padEnd(30)} ${p.name} - ${p.chucVu}`);
  }

  console.log("\n🎉 NCC gia công login với password 'Mimin@123'");
}
main().catch((e) => { console.error("💥", e.message); process.exit(1); });

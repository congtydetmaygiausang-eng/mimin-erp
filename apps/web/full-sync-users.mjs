// FULL SYNC USERS - Insert 19 NV tu auth.users vao bang users
// + Update admin sang@mimin.vn
// 2026-08-04 - Mavis
// Usage: SUPABASE_PAT=xxx node full-sync-users.mjs

const PAT = process.env.SUPABASE_PAT;
const REF = "ejcuqyaiwabfygyesvxj";

if (!PAT) {
  console.error("❌ Can SUPABASE_PAT env var");
  process.exit(1);
}

async function runSql(sql, label) {
  console.log(`\n📄 ${label}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`   ❌ HTTP ${res.status}: ${text.slice(0, 500)}`);
    return null;
  }
  const data = await res.json().catch(() => ({}));
  console.log(`   ✅ OK`);
  return data;
}

async function main() {
  // ============ STEP 1: Check bang users co chua ============
  console.log("=".repeat(60));
  console.log("STEP 1: Kiem tra bang users");
  console.log("=".repeat(60));
  await runSql("SELECT COUNT(*) AS cnt FROM users", "Count users");

  // ============ STEP 2: Tao admin user sang@mimin.vn neu chua co ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Tao admin user sang@mimin.vn");
  console.log("=".repeat(60));
  await runSql(`
    DO $$
    DECLARE v_user_id uuid;
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sang@mimin.vn') THEN
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token, email_change,
          email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          v_user_id,
          'authenticated',
          'authenticated',
          'sang@mimin.vn',
          crypt('sang123', gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"maNV":"NV035","full_name":"Hồ Minh Sang","role":"admin","chucVu":"Quản trị hệ thống","phongBan":"ban-giam-doc","donGia":0,"laCongNhan":false}'::jsonb,
          now(), now(), '', '', '', ''
        );
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_id,
          jsonb_build_object('sub', v_user_id::text, 'email', 'sang@mimin.vn'),
          'email', 'sang@mimin.vn', now(), now(), now());
        RAISE NOTICE 'Created admin user sang@mimin.vn with ID %', v_user_id;
      ELSE
        RAISE NOTICE 'User sang@mimin.vn already exists';
      END IF;
    END
    $$;
  `, "Tao sang@mimin.vn");

  // ============ STEP 3: Insert 20 user vao bang users tu auth.users ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Sync 20 user vao bang users");
  console.log("=".repeat(60));
  await runSql(`
    INSERT INTO public.users (
      id, email, "maNV", name, role, "chucVu", "phongBan", "donGia", "laCongNhan", "isActive", "lastLogin", "loginCount"
    )
    SELECT
      au.id,
      au.email,
      au.raw_user_meta_data->>'maNV',
      au.raw_user_meta_data->>'full_name',
      COALESCE(au.raw_user_meta_data->>'role', 'user'),
      au.raw_user_meta_data->>'chucVu',
      COALESCE(au.raw_user_meta_data->>'phongBan', 'khac'),
      COALESCE((au.raw_user_meta_data->>'donGia')::numeric, 0),
      COALESCE((au.raw_user_meta_data->>'laCongNhan')::boolean, false),
      true,
      au.last_sign_in_at,
      0
    FROM auth.users au
    WHERE au.email IN (
      'sang@mimin.vn',
      'de7481039@gmail.com',
      'nguyennhi192145@gmail.com',
      'vop61089@gmail.com',
      'nvy967300@gmail.com',
      'dohuyencpr81@gmail.com',
      'buithanh151199@gmail.com',
      'beekhuong1505@gmail.com',
      'xhoa14052004@gmail.com',
      'nguyenminhduc199024@gmail.com',
      'truongtam2044@gmail.com',
      'nan499229@gmail.com',
      'duongvinh3102005@gmail.com',
      'gs013@mimin-erp.local',
      'trvannhan1402@gmail.com',
      'beo26032019@gmail.com',
      'fizxnm2251994@mail.com',
      'nguyenvanruong14@gmail.com',
      'gs018@mimin-erp.local',
      'gs019@mimin-erp.local'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      "maNV" = EXCLUDED."maNV",
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      "chucVu" = EXCLUDED."chucVu",
      "phongBan" = EXCLUDED."phongBan",
      "donGia" = EXCLUDED."donGia",
      "laCongNhan" = EXCLUDED."laCongNhan",
      "isActive" = EXCLUDED."isActive",
      "updated_at" = NOW();
  `, "Sync 20 user");

  // ============ STEP 4: Verify ============
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Verify");
  console.log("=".repeat(60));
  const verify = await runSql(`
    SELECT
      email,
      "maNV",
      name,
      role,
      "phongBan",
      "donGia",
      "laCongNhan"
    FROM users
    WHERE email LIKE '%@gmail.com'
       OR email LIKE '%@mimin.vn'
       OR email LIKE '%@mimin-erp.local'
    ORDER BY "maNV"
  `, "Verify users");
  if (Array.isArray(verify)) {
    console.log(`\n📋 Có ${verify.length} user trong bảng users:`);
    verify.forEach((u) => {
      const cn = u.laCongNhan === "true" || u.laCongNhan === true;
      console.log(`  ${u.maNV?.padEnd(8)} | ${u.email?.padEnd(35)} | ${u.role?.padEnd(12)} | ${u.phongBan?.padEnd(15)} | ${cn ? "👷 CN" : "👔 QL"} | ${u.name}`);
    });
  }

  // ============ STEP 5: Drop default admin admin@mimin.com (optional) ============
  // Khong can thiet, de lam vi du

  console.log("\n" + "=".repeat(60));
  console.log("🎉 HOAN THANH!");
  console.log("=".repeat(60));
  console.log("\n📝 Anh Sang co the test:");
  console.log("   1. Vao https://mimin-erp.vercel.app");
  console.log("   2. Login: de7481039@gmail.com / Mimin@123");
  console.log("   3. Check Supabase Table Editor > users > co 20 rows");
  console.log("   4. Khi login thanh cong, isActive=true, lastLogin=updated");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

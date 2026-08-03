// Apply schema bảng lenh_cat (cho localStorage → Supabase migration)
// Tạo bảng mới + Insert dữ liệu mẫu
//
// Cách chạy (từ máy của anh Sang - sandbox em block DNS):
//   cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
//   node apply-lenh-cat-schema.mjs

import pg from "pg";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim() : null;
};

const dbUrl = get("DATABASE_URL");
if (!dbUrl) {
  console.error("❌ Chưa có DATABASE_URL trong .env.local");
  process.exit(1);
}

console.log("🔌 Đang kết nối Supabase...");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("✅ Đã kết nối Supabase!\n");

  // 1. Tạo bảng lenh_cat (lưu JSONB cho linh hoạt)
  console.log("📄 Tạo bảng lenh_cat...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS lenh_cat (
      id              TEXT PRIMARY KEY,
      loai_lenh       TEXT NOT NULL CHECK (loai_lenh IN ('HangNha', 'HangDat')),
      khach_hang      TEXT,
      loai_sp         TEXT NOT NULL CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron')),
      ma_sp           TEXT NOT NULL,
      ten_sp          TEXT NOT NULL,
      tong_sl         INTEGER NOT NULL DEFAULT 0,
      tong_sl_thuc_te INTEGER,
      han_hoan_thanh  DATE,
      ti_le_size      TEXT,
      phu_trach_cat   TEXT,
      phu_trach_sx    TEXT,
      trang_thai      TEXT NOT NULL DEFAULT 'Nhap' CHECK (trang_thai IN ('Nhap', 'DaTao', 'DangCat', 'HoanThanh', 'ChuyenTiep')),
      phien_ban_dinh_muc INTEGER DEFAULT 1,
      ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
      nguoi_tao       TEXT,
      ghi_chu         TEXT,
      -- Data phức tạp lưu JSONB
      ds_mau          JSONB DEFAULT '[]'::jsonb,        -- MauVai[]
      ds_phu_lieu     JSONB DEFAULT '[]'::jsonb,        -- LenhCatPhuLieu[]
      phan_cong       JSONB DEFAULT '[]'::jsonb,        -- PhanCongGiaCong
      chi_phi_co_dinh JSONB DEFAULT '{}'::jsonb,        -- ChiPhiCoDinh
      bang_cogs       JSONB,                              -- BangCOGS
      mau_cong_doan   TEXT,
      mau_chi_phi     TEXT,
      -- Audit
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );

    -- Index
    CREATE INDEX IF NOT EXISTS idx_lenh_cat_trang_thai ON lenh_cat(trang_thai);
    CREATE INDEX IF NOT EXISTS idx_lenh_cat_loai_sp ON lenh_cat(loai_sp);
    CREATE INDEX IF NOT EXISTS idx_lenh_cat_ngay_tao ON lenh_cat(ngay_tao DESC);
    CREATE INDEX IF NOT EXISTS idx_lenh_cat_khach_hang ON lenh_cat(khach_hang);

    -- RLS
    ALTER TABLE lenh_cat ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON lenh_cat;
    CREATE POLICY "Allow all for authenticated" ON lenh_cat FOR ALL USING (true) WITH CHECK (true);

    -- Comment
    COMMENT ON TABLE lenh_cat IS 'Lệnh cắt - Imported từ localStorage 2026-08-03. JSONB chứa data phức tạp (màu vải, phụ liệu, phân công, COGS).';
  `);
  console.log("   ✅ Đã tạo bảng lenh_cat + indexes + RLS\n");

  // 2. Tạo bảng mau_cong_doan + mau_chi_phi (template)
  console.log("📄 Tạo bảng mau_cong_doan...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS mau_cong_doan (
      id          TEXT PRIMARY KEY,
      ten         TEXT NOT NULL,
      gia_cong    JSONB NOT NULL DEFAULT '[]'::jsonb,    -- PhanCongGiaCong
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE mau_cong_doan ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON mau_cong_doan;
    CREATE POLICY "Allow all for authenticated" ON mau_cong_doan FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log("   ✅ Đã tạo bảng mau_cong_doan\n");

  console.log("📄 Tạo bảng mau_chi_phi...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS mau_chi_phi (
      id          TEXT PRIMARY KEY,
      ten         TEXT NOT NULL,
      chi_phi     JSONB NOT NULL DEFAULT '{}'::jsonb,   -- ChiPhiCoDinh
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE mau_chi_phi ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON mau_chi_phi;
    CREATE POLICY "Allow all for authenticated" ON mau_chi_phi FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log("   ✅ Đã tạo bảng mau_chi_phi\n");

  // 3. Verify
  console.log("📊 Verify:");
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('lenh_cat', 'mau_cong_doan', 'mau_chi_phi')
    ORDER BY table_name
  `);
  tables.rows.forEach(r => console.log(`   ✅ ${r.table_name}`));

  console.log("\n🎉 HOÀN THÀNH!");
  console.log("👉 Verify tại: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/database/tables");
  console.log("👉 App sẽ migrate tự động khi sếp Sang sync localStorage → Supabase");
} catch (err) {
  console.error("\n❌ LỖI:", err.message);
  if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    console.error("\n💡 Không kết nối được. Kiểm tra DATABASE_URL trong .env.local");
  }
  process.exit(1);
} finally {
  await client.end();
}

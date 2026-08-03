-- ============================================
-- APPLY-SUPABASE-CAMELCASE.sql
-- Convert 11 bang sync sang camelCase (khop voi app code)
-- Date: 2026-08-04
-- ============================================
-- GIU NGUYEN: nha_cung_cap (20 rows), nhan_su (18 rows) - khong can doi
-- XOA + TAO LAI: 11 bang sync (dang 0 rows, snake_case khong khop app code)

-- ============================================
-- 1. DROP 11 BANG CU
-- ============================================
DROP TABLE IF EXISTS lenh_cat CASCADE;
DROP TABLE IF EXISTS mau_cong_doan CASCADE;
DROP TABLE IF EXISTS mau_chi_phi CASCADE;
DROP TABLE IF EXISTS cong_no CASCADE;
DROP TABLE IF EXISTS khsx CASCADE;
DROP TABLE IF EXISTS qc_records CASCADE;
DROP TABLE IF EXISTS hoan_thien CASCADE;
DROP TABLE IF EXISTS giao_hang CASCADE;
DROP TABLE IF EXISTS gia_cong CASCADE;
DROP TABLE IF EXISTS doi_soat CASCADE;
DROP TABLE IF EXISTS kho_mobile CASCADE;

-- ============================================
-- 2. CREATE LAI VOI CAMELCASE COLUMNS
-- PostgreSQL can quote camelCase bang double quotes
-- ============================================

-- Bang Lenh Cat (module chinh)
CREATE TABLE IF NOT EXISTS lenh_cat (
  id                TEXT PRIMARY KEY,
  "loaiLenh"        TEXT NOT NULL CHECK ("loaiLenh" IN ('HangNha', 'HangDat')),
  "khachHang"       TEXT,
  "loaiSP"          TEXT NOT NULL CHECK ("loaiSP" IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron')),
  "maSP"            TEXT NOT NULL,
  "tenSP"           TEXT NOT NULL,
  "tongSL"          INTEGER NOT NULL DEFAULT 0,
  "tongSLThucTe"    INTEGER,
  "hanHoanThanh"    DATE,
  "tiLeSize"        TEXT,
  "phuTrachCat"     TEXT,
  "phuTrachSX"      TEXT,
  "trangThai"       TEXT NOT NULL DEFAULT 'Nhap' CHECK ("trangThai" IN ('Nhap', 'DaTao', 'DangCat', 'HoanThanh', 'ChuyenTiep')),
  "phienBanDinhMuc" INTEGER DEFAULT 1,
  "ngayTao"         TIMESTAMPTZ DEFAULT NOW(),
  "nguoiTao"        TEXT,
  "ghiChu"          TEXT,
  "dsMau"           JSONB DEFAULT '[]'::jsonb,
  "dsPhuLieu"       JSONB DEFAULT '[]'::jsonb,
  "phanCong"        JSONB DEFAULT '[]'::jsonb,
  "chiPhiCoDinh"    JSONB DEFAULT '{}'::jsonb,
  "bangCOGS"        JSONB,
  "mauCongDoan"     TEXT,
  "mauChiPhi"       TEXT,
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenh_cat_trang_thai ON lenh_cat("trangThai");
CREATE INDEX IF NOT EXISTS idx_lenh_cat_loai_sp ON lenh_cat("loaiSP");
CREATE INDEX IF NOT EXISTS idx_lenh_cat_ngay_tao ON lenh_cat("ngayTao" DESC);

-- Bang Mau cong doan
CREATE TABLE IF NOT EXISTS mau_cong_doan (
  id          TEXT PRIMARY KEY,
  "tenMau"    TEXT NOT NULL,
  "dsCongDoan" JSONB DEFAULT '[]'::jsonb,
  "moTa"      TEXT,
  "nguoiTao"  TEXT,
  "ngayTao"   TIMESTAMPTZ DEFAULT NOW(),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Mau chi phi
CREATE TABLE IF NOT EXISTS mau_chi_phi (
  id          TEXT PRIMARY KEY,
  "tenMau"    TEXT NOT NULL,
  "dsChiPhi"  JSONB DEFAULT '[]'::jsonb,
  "moTa"      TEXT,
  "nguoiTao"  TEXT,
  "ngayTao"   TIMESTAMPTZ DEFAULT NOW(),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Cong no (cong no theo cong doan)
CREATE TABLE IF NOT EXISTS cong_no (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "boPhan"        TEXT,
  "nguoiPhuTrach" TEXT,
  "soTien"        NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'CHUA_TT',
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "ngayTT"        DATE,
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang KHSX (ke hoach san xuat)
CREATE TABLE IF NOT EXISTS khsx (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "maNV"          TEXT,
  "ngayBatDau"    DATE,
  "ngayKetThuc"   DATE,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'ChuaThucHien',
  "ghiChu"        TEXT,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang QC records
CREATE TABLE IF NOT EXISTS qc_records (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "maNV"          TEXT,
  "ketQua"        TEXT,
  "soLuongDat"    INTEGER DEFAULT 0,
  "soLuongLoi"    INTEGER DEFAULT 0,
  "ghiChu"        TEXT,
  "ngayKiem"      TIMESTAMPTZ DEFAULT NOW(),
  "nguoiKiem"     TEXT,
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Hoan thien
CREATE TABLE IF NOT EXISTS hoan_thien (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "maNV"          TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'ChuaHT',
  "ngayHT"        DATE,
  "ghiChu"        TEXT,
  "nguoiThucHien" TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Giao hang
CREATE TABLE IF NOT EXISTS giao_hang (
  id              TEXT PRIMARY KEY,
  "maDonHang"     TEXT,
  "khachHang"     TEXT,
  "diaChi"        TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'ChuaGH',
  "ngayGH"        DATE,
  "nguoiGH"       TEXT,
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Gia cong
CREATE TABLE IF NOT EXISTS gia_cong (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "doiTac"        TEXT,
  "soLuongGiao"   INTEGER DEFAULT 0,
  "donGia"        NUMERIC DEFAULT 0,
  "thanhTien"     NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'ChuaHT',
  "ghiChu"        TEXT,
  "ngayGiao"      DATE,
  "ngayHT"        DATE,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Doi soat
CREATE TABLE IF NOT EXISTS doi_soat (
  id              TEXT PRIMARY KEY,
  "doiTac"        TEXT,
  "thang"         DATE,
  "soTien"        NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'ChuaDS',
  "ghiChu"        TEXT,
  "nguoiDS"       TEXT,
  "ngayDS"        DATE,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- Bang Kho mobile
CREATE TABLE IF NOT EXISTS kho_mobile (
  id              TEXT PRIMARY KEY,
  "maVai"         TEXT,
  "loaiGiaoDich"  TEXT,
  "soLuong"       NUMERIC DEFAULT 0,
  "donVi"         TEXT,
  "nguoiThucHien" TEXT,
  "ghiChu"        TEXT,
  "ngayGD"        TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. REALTIME (re-enable cho 11 bang moi)
-- ============================================
-- Note: Neu can realtime, them bang vao supabase_realtime publication
-- ALTER PUBLICATION supabase_realtime ADD TABLE lenh_cat, mau_cong_doan, mau_chi_phi, cong_no, khsx, qc_records, hoan_thien, giao_hang, gia_cong, doi_soat, kho_mobile;

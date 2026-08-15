-- ============================================================
-- FIX-GD0-SYNC-TABLES-CAMELCASE.sql
-- Giai đoạn 0 (nền dữ liệu): tạo lại 6 bảng sync KHỚP model app hiện tại.
-- Ngày: 2026-08-15
--
-- LÝ DO: 6 bảng cũ (khsx, qc_records, giao_hang, hoan_thien, doi_soat, kho_mobile)
--   được tạo bằng APPLY-SUPABASE-CAMELCASE.sql (2026-08-04) với schema KHÁC hẳn
--   model app hiện tại (vd khsx cũ có maLenhCat/maNV/ngayBatDau, còn app dùng
--   maKHSX/tuan/sanPham/daHoanThanh/xuongPhuTrach...). Vì lệch cột nên mọi lần ghi
--   đều fail âm thầm → các bảng này đang 0 dòng.
--
-- AN TOÀN: 6 bảng đang RỖNG (0 dòng) nên DROP + CREATE không mất dữ liệu.
--   KHÔNG đụng tới: nhan_su, lenh_cat, giao_dich_kho (80 dòng), cong_nhan_gia_cong (27 dòng),
--   nha_cung_cap, khach_hang, doi_tac... (đã có dữ liệu / đang chạy).
--
-- CÁCH CHẠY: Supabase Dashboard → SQL Editor → dán toàn bộ file → Run.
-- Cột camelCase để KHỚP trực tiếp app (đọc/ghi qua supabaseFetchAllRaw / supabaseUpsertRaw,
--   KHÔNG convert key). Mảng lồng (lichSu, loi, khiieuNai) lưu JSONB.
-- ============================================================

-- ---------- 1) KHSX (Kế hoạch sản xuất) ----------
DROP TABLE IF EXISTS khsx CASCADE;
CREATE TABLE khsx (
  id              TEXT PRIMARY KEY,
  "maKHSX"        TEXT,
  "tuan"          TEXT,
  "tuNgay"        TEXT,
  "denNgay"       TEXT,
  "sanPham"       TEXT,
  "loai"          TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "daHoanThanh"   INTEGER DEFAULT 0,
  "xuongPhuTrach" TEXT,
  "trangThai"     TEXT,
  "ghiChu"        TEXT,
  "ngayTao"       TEXT,
  "nguoiTao"      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 2) QC_RECORDS (Kiểm tra chất lượng) ----------
DROP TABLE IF EXISTS qc_records CASCADE;
CREATE TABLE qc_records (
  id              TEXT PRIMARY KEY,
  "taskId"        TEXT,
  "lenhSX"        TEXT,
  "maSP"          TEXT,
  "phanLoai"      TEXT,
  "congDoan"      TEXT,
  "nguoiThucHien" TEXT,
  "soLuongGiao"   INTEGER DEFAULT 0,
  "soLuongKiem"   INTEGER DEFAULT 0,
  "soLuongDat"    INTEGER DEFAULT 0,
  "soLuongLoi"    INTEGER DEFAULT 0,
  "tiLeDat"       NUMERIC DEFAULT 0,
  "loi"           JSONB DEFAULT '[]'::jsonb,
  "trangThai"     TEXT,
  "nguoiKiem"     TEXT,
  "ngayKiem"      TEXT,
  "ngayHoanThanh" TEXT,
  "ghiChu"        TEXT,
  "lichSu"        JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 3) GIAO_HANG (Giao hàng) ----------
DROP TABLE IF EXISTS giao_hang CASCADE;
CREATE TABLE giao_hang (
  id               TEXT PRIMARY KEY,
  "maGH"           TEXT,
  "ngayGiao"       TEXT,
  "donHang"        TEXT,
  "khachHang"      TEXT,
  "sdt"            TEXT,
  "diaChi"         TEXT,
  "soLuong"        INTEGER DEFAULT 0,
  "trangThai"      TEXT,
  "phuongTien"     TEXT,
  "nguoiVanChuyen" TEXT,
  "ghiChu"         TEXT,
  "ngayTao"        TEXT,
  "nguoiTao"       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 4) HOAN_THIEN (Bàn giao hoàn thiện: KN/Ủi/Đóng gói) ----------
DROP TABLE IF EXISTS hoan_thien CASCADE;
CREATE TABLE hoan_thien (
  id                 TEXT PRIMARY KEY,
  "taskId"           TEXT,
  "lenhSX"           TEXT,
  "maSP"             TEXT,
  "phanLoai"         TEXT,
  "mau"              TEXT,
  "size"             TEXT,
  "congDoan"         TEXT,
  "nguoiThucHien"    TEXT,
  "nguoiThucHienMa"  TEXT,
  "ngayGiao"         TEXT,
  "hanHoanThanh"     TEXT,
  "ngayNhan"         TEXT,
  "ngayHoanThanh"    TEXT,
  "ngayBanGiao"      TEXT,
  "soLuongGiao"      INTEGER DEFAULT 0,
  "soLuongNhan"      INTEGER DEFAULT 0,
  "soLuongDat"       INTEGER DEFAULT 0,
  "soLuongLoi"       INTEGER DEFAULT 0,
  "donGia"           NUMERIC DEFAULT 0,
  "thanhTien"        NUMERIC DEFAULT 0,
  "ghiChu"           TEXT,
  "trangThai"        TEXT,
  "lichSu"           JSONB DEFAULT '[]'::jsonb,
  "locked"           BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 5) DOI_SOAT (Đối soát tiền công) ----------
DROP TABLE IF EXISTS doi_soat CASCADE;
CREATE TABLE doi_soat (
  id                 TEXT PRIMARY KEY,
  "taskId"           TEXT,
  "ngayGiao"         TEXT,
  "nguoiThucHien"    TEXT,
  "nguoiThucHienMa"  TEXT,
  "congDoan"         TEXT,
  "maSP"             TEXT,
  "phanLoai"         TEXT,
  "soLuongNhan"      INTEGER DEFAULT 0,
  "soLuongDat"       INTEGER DEFAULT 0,
  "soLuongLoi"       INTEGER DEFAULT 0,
  "donGia"           NUMERIC DEFAULT 0,
  "thanhTien"        NUMERIC DEFAULT 0,
  "khauTru"          NUMERIC DEFAULT 0,
  "thucNhan"         NUMERIC DEFAULT 0,
  "daThanhToan"      NUMERIC DEFAULT 0,
  "conNo"            NUMERIC DEFAULT 0,
  "trangThai"        TEXT,
  "lichSu"           JSONB DEFAULT '[]'::jsonb,
  "khiieuNai"        JSONB,
  "ngayTao"          TEXT,
  "nguoiTao"         TEXT,
  "locked"           BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 6) KHO_MOBILE (Phiếu nhập/xuất kho mobile) ----------
DROP TABLE IF EXISTS kho_mobile CASCADE;
CREATE TABLE kho_mobile (
  id               TEXT PRIMARY KEY,
  "loai"           TEXT,
  "loaiKho"        TEXT,
  "maSP"           TEXT,
  "tenSP"          TEXT,
  "soLuong"        NUMERIC DEFAULT 0,
  "donVi"          TEXT,
  "donGia"         NUMERIC DEFAULT 0,
  "thanhTien"      NUMERIC DEFAULT 0,
  "nhaCC"          TEXT,
  "lsx"            TEXT,
  "maNV"           TEXT,
  "nguoiTao"       TEXT,
  "nguoiDuyet"     TEXT,
  "ngayTao"        TEXT,
  "ngayDuyet"      TEXT,
  "ngayHoanThanh"  TEXT,
  "trangThai"      TEXT,
  "ghiChu"         TEXT,
  "lichSu"         JSONB DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7) RLS: anon đọc, authenticated ghi (đồng bộ mẫu các bảng hiện có)
-- ============================================================
-- LƯU Ý QUAN TRỌNG: DROP TABLE CASCADE xoá luôn GRANT + policy cũ của bảng.
-- Nếu chỉ tạo RLS policy mà không GRANT lại, Postgres vẫn chặn với lỗi 42501
-- "permission denied" (RLS chỉ lọc THÊM, không thay thế GRANT nền tảng).
-- Đây chính là lý do 6 bảng này bị lỗi "permission denied" từ trước tới nay.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['khsx','qc_records','giao_hang','hoan_thien','doi_soat','kho_mobile']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_read_%1$s" ON public.%1$I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_write_%1$s" ON public.%1$I;', t);
    EXECUTE format('CREATE POLICY "anon_read_%1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY "auth_write_%1$s" ON public.%1$I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- 8) Realtime (tùy chọn — bật nếu muốn đồng bộ tức thời đa thiết bị)
-- ALTER PUBLICATION supabase_realtime ADD TABLE khsx, qc_records, giao_hang, hoan_thien, doi_soat, kho_mobile;

-- ============================================================
-- 10) FIX bổ sung (phát hiện lúc chạy thử app 2026-08-15) - CHỈ ADD COLUMN,
--   KHÔNG đụng dữ liệu hiện có của 2 bảng nhan_su / phan_cong.
-- ============================================================

-- 10a) nhan_su thiếu cột "don_gia_sp" -> code select tường minh cột này
--   nên MỌI lần fetch nhan_su từ Supabase đều lỗi và rơi về danh sách mẫu.
--   Trang /nhan-su vì vậy không hiển thị 17 NV thật, chỉ hiện data cứng.
ALTER TABLE public.nhan_su ADD COLUMN IF NOT EXISTS don_gia_sp TEXT;

-- 10b) phan_cong (bảng "Phân công công đoạn" trong /cong-no) đã đúng gần hết
--   cột (lenh_cat_id, cong_doan, don_gia_giao, so_luong_giao, don_vi, ngay_giao,
--   ngay_xong_du_kien, trang_thai, da_thanh_toan, ghi_chu) - CHỈ THIẾU 1 cột
--   "nguoi_phu_trach" (JSONB vì app lưu object {loai, ma, ten, sdt}), khiến MỌI
--   lần lưu phân công đều lỗi "Could not find column" lặp liên tục.
ALTER TABLE public.phan_cong ADD COLUMN IF NOT EXISTS nguoi_phu_trach JSONB;

-- 9) Nạp lại schema cache của PostgREST
NOTIFY pgrst, 'reload schema';

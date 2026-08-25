-- ==============================================================================
-- MIMIN ERP - KHỞI TẠO CÁC BẢNG ĐỒNG BỘ CHUẨN CAMELCASE (2026-08-23)
-- Chạy script này trong SQL Editor của Supabase
-- ==============================================================================

-- 1. Bảng khsx (Kế Hoạch Sản Xuất)
CREATE TABLE IF NOT EXISTS public.khsx (
  "id" TEXT PRIMARY KEY,
  "maKHSX" TEXT,
  "tuan" TEXT,
  "tuNgay" TEXT,
  "denNgay" TEXT,
  "sanPham" TEXT,
  "loai" TEXT,
  "soLuong" INTEGER,
  "daHoanThanh" INTEGER,
  "xuongPhuTrach" TEXT,
  "trangThai" TEXT,
  "ghiChu" TEXT,
  "ngayTao" TEXT,
  "nguoiTao" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng giao_hang (Vận Chuyển / Giao Hàng)
CREATE TABLE IF NOT EXISTS public.giao_hang (
  "id" TEXT PRIMARY KEY,
  "maGH" TEXT,
  "ngayGiao" TEXT,
  "donHang" TEXT,
  "khachHang" TEXT,
  "sdt" TEXT,
  "diaChi" TEXT,
  "soLuong" INTEGER,
  "trangThai" TEXT,
  "phuongTien" TEXT,
  "nguoiVanChuyen" TEXT,
  "ghiChu" TEXT,
  "ngayTao" TEXT,
  "nguoiTao" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng hoan_thien (Hoàn Thiện Sản Phẩm)
CREATE TABLE IF NOT EXISTS public.hoan_thien (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT,
  "lenhSX" TEXT,
  "maSP" TEXT,
  "phanLoai" TEXT,
  "mau" TEXT,
  "size" TEXT,
  "congDoan" TEXT,
  "nguoiThucHien" TEXT,
  "nguoiThucHienMa" TEXT,
  "ngayGiao" TEXT,
  "hanHoanThanh" TEXT,
  "ngayNhan" TEXT,
  "ngayHoanThanh" TEXT,
  "ngayBanGiao" TEXT,
  "soLuongGiao" INTEGER,
  "soLuongNhan" INTEGER,
  "soLuongDat" INTEGER,
  "soLuongLoi" INTEGER,
  "donGia" NUMERIC,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng qc_records (Kiểm Tra Chất Lượng - QC)
CREATE TABLE IF NOT EXISTS public.qc_records (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT,
  "lenhSX" TEXT,
  "maSP" TEXT,
  "phanLoai" TEXT,
  "congDoan" TEXT,
  "nguoiThucHien" TEXT,
  "soLuongGiao" INTEGER,
  "soLuongKiem" INTEGER,
  "soLuongDat" INTEGER,
  "soLuongLoi" INTEGER,
  "tiLeDat" NUMERIC,
  "loi" JSONB,
  "trangThai" TEXT,
  "nguoiKiem" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng doi_soat (Đối Soát Công Nợ)
CREATE TABLE IF NOT EXISTS public.doi_soat (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT,
  "ngayGiao" TEXT,
  "nguoiThucHien" TEXT,
  "nguoiThucHienMa" TEXT,
  "congDoan" TEXT,
  "maSP" TEXT,
  "phanLoai" TEXT,
  "soLuongNhan" INTEGER,
  "soLuongDat" INTEGER,
  "soLuongLoi" INTEGER,
  "donGia" NUMERIC,
  "thanhTien" NUMERIC,
  "khauTru" NUMERIC,
  "thucNhan" NUMERIC,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng kho_mobile (Kho Di Động / Nhập Xuất Nhanh)
CREATE TABLE IF NOT EXISTS public.kho_mobile (
  "id" TEXT PRIMARY KEY,
  "loai" TEXT,
  "loaiKho" TEXT,
  "maSP" TEXT,
  "tenSP" TEXT,
  "soLuong" INTEGER,
  "donVi" TEXT,
  "donGia" NUMERIC,
  "thanhTien" NUMERIC,
  "nhaCC" TEXT,
  "lsx" TEXT,
  "maNV" TEXT,
  "nguoiTao" TEXT,
  "nguoiDuyet" TEXT,
  "ngayTao" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng gia_cong (Theo dõi Tiến độ Gia Công)
CREATE TABLE IF NOT EXISTS public.gia_cong (
  "id" TEXT PRIMARY KEY,
  "trangThai" TEXT,
  "sanLuongUpdates" JSONB,
  "banGiaoRecords" JSONB,
  "loiReports" JSONB,
  "requestSupports" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Đã khởi tạo thành công 7 bảng dữ liệu nâng cấp (KHSX, Giao Hàng, Hoàn Thiện, QC, Đối Soát, Kho Mobile, Gia Công)!';
END $$;

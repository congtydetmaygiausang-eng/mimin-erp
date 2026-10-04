-- ==============================================================================
-- SCRIPT TẠO BẢNG SỔ QUỸ THU CHI NỘI BỘ (thu_chi_noi_bo) TRÊN SUPABASE
-- MIMIN ERP - Quản lý xưởng may
-- Hướng dẫn: Copy toàn bộ script này và dán vào Supabase > SQL Editor rồi bấm RUN
-- ==============================================================================

-- 1. Tạo bảng thu_chi_noi_bo
CREATE TABLE IF NOT EXISTS public.thu_chi_noi_bo (
  id TEXT PRIMARY KEY,
  loai TEXT NOT NULL CHECK (loai IN ('thu', 'chi')),
  danh_muc TEXT NOT NULL,
  so_tien NUMERIC(15, 2) NOT NULL DEFAULT 0,
  hinh_thuc TEXT NOT NULL DEFAULT 'tien_mat' CHECK (hinh_thuc IN ('tien_mat', 'chuyen_khoan')),
  ngay DATE NOT NULL DEFAULT CURRENT_DATE,
  nguoi_thuc_hien TEXT NOT NULL,
  nguoi_nhan TEXT,
  noi_dung TEXT NOT NULL,
  hinh_anh JSONB DEFAULT '[]'::jsonb,
  
  -- Thông tin người dùng đăng nhập nhập phiếu vào hệ thống
  nguoi_nhap TEXT,
  email_nguoi_nhap TEXT,
  role_nguoi_nhap TEXT,
  
  ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cấp quyền truy cập bảng cho anon, authenticated và service_role
-- (BẮT BUỘC ĐỂ KHÔNG BỊ LỖI 42501: permission denied for table thu_chi_noi_bo)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thu_chi_noi_bo TO anon;
GRANT ALL ON TABLE public.thu_chi_noi_bo TO authenticated;
GRANT ALL ON TABLE public.thu_chi_noi_bo TO service_role;

-- 3. Cấu hình Row Level Security (RLS) & Policy toàn quyền cho Web App
ALTER TABLE public.thu_chi_noi_bo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated and anon users on thu_chi_noi_bo" ON public.thu_chi_noi_bo;
DROP POLICY IF EXISTS "Allow all for anon and authenticated on thu_chi_noi_bo" ON public.thu_chi_noi_bo;

CREATE POLICY "Allow all for anon and authenticated on thu_chi_noi_bo"
ON public.thu_chi_noi_bo
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. Tạo các chỉ mục (Indexes) để truy vấn và tìm kiếm siêu nhanh
CREATE INDEX IF NOT EXISTS idx_thu_chi_ngay ON public.thu_chi_noi_bo(ngay DESC);
CREATE INDEX IF NOT EXISTS idx_thu_chi_loai ON public.thu_chi_noi_bo(loai);
CREATE INDEX IF NOT EXISTS idx_thu_chi_danh_muc ON public.thu_chi_noi_bo(danh_muc);
CREATE INDEX IF NOT EXISTS idx_thu_chi_email_nguoi_nhap ON public.thu_chi_noi_bo(email_nguoi_nhap);

-- 5. Cho phép Realtime cập nhật tức thì qua các máy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.thu_chi_noi_bo;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Bỏ qua nếu bảng đã có trong publication
  NULL;
END $$;

COMMENT ON TABLE public.thu_chi_noi_bo IS 'Bảng lưu trữ sổ quỹ thu chi nội bộ, tiền cơm trưa, điện nước, vật dụng xưởng may MIMIN ERP';

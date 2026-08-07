-- ===================================================================
-- MIMIN ERP - Bo sung 4 lien ket Foreign Key (FK)
-- Ngay 2026-08-07 - Mavis
-- Sep yeu cau:
--   1. Xưởng Gia Công ↔ Lệnh Cắt & Công Nợ
--   2. Sản Phẩm & Khách Hàng ↔ Lệnh Cắt
--   3. Kho Vật Tư ↔ Nhà Cung Cấp
--   4. Nhân sự ↔ Users (Supabase Auth)
-- ===================================================================
-- Chay tren Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- ===================================================================

-- ===================================================================
-- BUOC 1: TAO CAC BANG CHUA TON TAI
-- ===================================================================

-- 1a. Bang xuong_gia_cong (master cho Đối tac gia cong)
CREATE TABLE IF NOT EXISTS public.xuong_gia_cong (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_xuong TEXT UNIQUE NOT NULL,
  ten_xuong TEXT NOT NULL,
  chuyen_mon TEXT NOT NULL CHECK (chuyen_mon IN ('In','Thêu','Wash','May','In-Thêu','Wash-May','In-Thêu-May','Khác')),
  sdt TEXT,
  email TEXT,
  nguoi_lh TEXT,
  dia_chi TEXT,
  mst TEXT,
  cong_suat TEXT,
  don_gia_tb NUMERIC(12,0) DEFAULT 0,
  don_vi TEXT DEFAULT 'cái',
  ngay_hop_tac DATE,
  thoi_han_thanh_toan INTEGER DEFAULT 30, -- ngay
  phuong_thuc_tt TEXT DEFAULT 'Chuyển khoản',
  -- CONG NO (P0 - them moi)
  cong_no NUMERIC(15,0) DEFAULT 0,
  da_thanh_toan NUMERIC(15,0) DEFAULT 0,
  con_lai NUMERIC(15,0) DEFAULT 0,
  -- Rating & trang thai
  rating NUMERIC(2,1) DEFAULT 4.0,
  trang_thai TEXT DEFAULT 'dang_hop_tac' CHECK (trang_thai IN ('dang_hop_tac','tam_dung','ngung_hop_tac')),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xuong_gia_cong_ma ON public.xuong_gia_cong(ma_xuong);
CREATE INDEX IF NOT EXISTS idx_xuong_gia_cong_chuyen_mon ON public.xuong_gia_cong(chuyen_mon);

-- 1b. Bang khach_hang_si (master cho Khach hang)
CREATE TABLE IF NOT EXISTS public.khach_hang_si (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_kh TEXT UNIQUE NOT NULL,
  ten_kh TEXT NOT NULL,
  -- FK: phan loai KH
  loai TEXT DEFAULT 'Cá nhân' CHECK (loai IN ('Đại lý cấp 1','Đại lý cấp 2','Cá nhân','Công ty','Shop')),
  sdt TEXT,
  email TEXT,
  mst TEXT,
  nguoi_lh TEXT,
  dia_chi TEXT,
  -- Cong no
  cong_no_hien_tai NUMERIC(15,0) DEFAULT 0,
  han_muc_no NUMERIC(15,0) DEFAULT 0,
  doanh_so_nam NUMERIC(15,0) DEFAULT 0,
  -- Chinh sach
  chinh_sach TEXT,
  sp_chinh TEXT,
  rating NUMERIC(2,1) DEFAULT 4.0,
  trang_thai TEXT DEFAULT 'Thường' CHECK (trang_thai IN ('Thường','VIP','Cấm nợ')),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_khach_hang_si_ma ON public.khach_hang_si(ma_kh);

-- 1c. Bang kho (master cho Kho vai + phu lieu)
CREATE TABLE IF NOT EXISTS public.kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  ten_vt TEXT NOT NULL,
  loai TEXT NOT NULL CHECK (loai IN ('Vai','Phụ liệu','Khác')),
  loai_chi_tiet TEXT, -- VD: 'Cotton 100%', 'Polyester'
  mau_sac TEXT,
  dvt TEXT DEFAULT 'kg', -- kg, m, cái, cuộn
  don_gia NUMERIC(12,0) DEFAULT 0,
  ton_kho NUMERIC(12,2) DEFAULT 0,
  ton_toi_thieu NUMERIC(12,2) DEFAULT 0,
  so_cay_nhap NUMERIC(12,2) DEFAULT 0,
  ton_cay NUMERIC(12,2) DEFAULT 0,
  -- FK: lien ket nha cung cap (P1 - them moi)
  ma_ncc TEXT REFERENCES public.nha_cung_cap(ma_ncc) ON DELETE SET NULL,
  -- Hao hut
  ty_le_hao_hut NUMERIC(5,2) DEFAULT 0, -- %
  kho TEXT DEFAULT 'Kho chính',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kho_sku ON public.kho(sku);
CREATE INDEX IF NOT EXISTS idx_kho_ma_ncc ON public.kho(ma_ncc);

-- 1d. Bang giao_dich_kho (NHAP/XUAT kho)
CREATE TABLE IF NOT EXISTS public.giao_dich_kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_gd TEXT UNIQUE NOT NULL,
  ngay DATE NOT NULL DEFAULT CURRENT_DATE,
  loai TEXT NOT NULL CHECK (loai IN ('NHAP','XUAT','XUAT_GIA_CONG')),
  -- FK
  sku TEXT REFERENCES public.kho(sku) ON DELETE CASCADE,
  ma_ncc TEXT REFERENCES public.nha_cung_cap(ma_ncc) ON DELETE SET NULL, -- cho NHAP
  ma_xuong TEXT REFERENCES public.xuong_gia_cong(ma_xuong) ON DELETE SET NULL, -- cho XUAT gia cong
  ma_lenh TEXT, -- cho XUAT (LC-2026-001)
  so_luong NUMERIC(12,2) NOT NULL,
  don_gia NUMERIC(12,0) DEFAULT 0,
  thanh_tien NUMERIC(15,0) DEFAULT 0,
  so_met NUMERIC(12,2), -- cho vai
  hao_hut NUMERIC(5,2), -- % hao hut (cho XUAT gia cong)
  nguoi_thuc_hien TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_kho_sku ON public.giao_dich_kho(sku);
CREATE INDEX IF NOT EXISTS idx_gd_kho_ma_ncc ON public.giao_dich_kho(ma_ncc);
CREATE INDEX IF NOT EXISTS idx_gd_kho_ma_xuong ON public.giao_dich_kho(ma_xuong);
CREATE INDEX IF NOT EXISTS idx_gd_kho_ma_lenh ON public.giao_dich_kho(ma_lenh);

-- 1e. Bang phan_cong (Phan cong cong doan - CẢ NV nội bộ + Xuong ngoai)
CREATE TABLE IF NOT EXISTS public.phan_cong (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK: Lenh cat
  ma_lenh TEXT NOT NULL,
  -- FK: San pham (de snapshot, không FK constraint de tranh loi khi xoa SP)
  ma_sp TEXT,
  -- LOAI NGUOI (P0 - moi)
  loai_nguoi TEXT NOT NULL CHECK (loai_nguoi IN ('noi_bo','xuong_ngoai')),
  -- FK: Nhan su hoac Xuong gia cong (moi 1 trong 2)
  ma_nv TEXT REFERENCES public.nhan_su(ma_nv) ON DELETE SET NULL,
  ma_xuong TEXT REFERENCES public.xuong_gia_cong(ma_xuong) ON DELETE SET NULL,
  -- Thong tin cong doan
  cong_doan TEXT NOT NULL, -- 'Cắt', 'May áo', 'In', 'Thêu', 'Ủi'...
  don_gia NUMERIC(12,0) DEFAULT 0,
  so_luong NUMERIC(12,2) DEFAULT 0,
  thanh_tien NUMERIC(15,0) DEFAULT 0,
  -- Thanh toan
  da_thanh_toan NUMERIC(15,0) DEFAULT 0,
  con_lai NUMERIC(15,0) DEFAULT 0,
  trang_thai_tt TEXT DEFAULT 'chua_tra' CHECK (trang_thai_tt IN ('chua_tra','tra_mot_phan','da_tra_du')),
  ngay_thanh_toan DATE,
  -- Audit
  ngay_tao TIMESTAMPTZ DEFAULT NOW(),
  nguoi_tao TEXT,
  ghi_chu TEXT,
  -- CHECK constraint: phai co ma_nv HOẶC ma_xuong
  CHECK ((loai_nguoi = 'noi_bo' AND ma_nv IS NOT NULL) OR (loai_nguoi = 'xuong_ngoai' AND ma_xuong IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_phan_cong_ma_lenh ON public.phan_cong(ma_lenh);
CREATE INDEX IF NOT EXISTS idx_phan_cong_ma_nv ON public.phan_cong(ma_nv);
CREATE INDEX IF NOT EXISTS idx_phan_cong_ma_xuong ON public.phan_cong(ma_xuong);

-- ===================================================================
-- BUOC 2: THEM COLUMNS FK VAO CAC BANG HIEN CO
-- ===================================================================

-- 2a. Bang lenh_cat: them ma_sp (FK) + ma_kh (FK)
ALTER TABLE public.lenh_cat ADD COLUMN IF NOT EXISTS ma_sp_fk TEXT;
ALTER TABLE public.lenh_cat ADD COLUMN IF NOT EXISTS ma_kh_fk TEXT;

-- FK constraints (neu chua co)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lenh_cat_ma_sp') THEN
    ALTER TABLE public.lenh_cat ADD CONSTRAINT fk_lenh_cat_ma_sp
      FOREIGN KEY (ma_sp_fk) REFERENCES public.san_pham(ma_sp) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lenh_cat_ma_kh') THEN
    ALTER TABLE public.lenh_cat ADD CONSTRAINT fk_lenh_cat_ma_kh
      FOREIGN KEY (ma_kh_fk) REFERENCES public.khach_hang_si(ma_kh) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lenh_cat_ma_sp_fk ON public.lenh_cat(ma_sp_fk);
CREATE INDEX IF NOT EXISTS idx_lenh_cat_ma_kh_fk ON public.lenh_cat(ma_kh_fk);

-- 2b. Bang nhan_su: them user_id (FK to auth.users)
ALTER TABLE public.nhan_su ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.nhan_su ADD COLUMN IF NOT EXISTS ngay_nghi_viec DATE;

-- FK constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nhan_su_user_id') THEN
    ALTER TABLE public.nhan_su ADD CONSTRAINT fk_nhan_su_user_id
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nhan_su_user_id ON public.nhan_su(user_id);

-- 2c. Bang cong_no: them ma_xuong (FK) + ma_kh (FK) + ma_ncc (FK) + ma_lenh (FK)
ALTER TABLE public.cong_no ADD COLUMN IF NOT EXISTS ma_xuong TEXT;
ALTER TABLE public.cong_no ADD COLUMN IF NOT EXISTS ma_kh TEXT;
ALTER TABLE public.cong_no ADD COLUMN IF NOT EXISTS ma_ncc TEXT;
ALTER TABLE public.cong_no ADD COLUMN IF NOT EXISTS ma_lenh TEXT;

-- FK constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cong_no_ma_xuong') THEN
    ALTER TABLE public.cong_no ADD CONSTRAINT fk_cong_no_ma_xuong
      FOREIGN KEY (ma_xuong) REFERENCES public.xuong_gia_cong(ma_xuong) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cong_no_ma_kh') THEN
    ALTER TABLE public.cong_no ADD CONSTRAINT fk_cong_no_ma_kh
      FOREIGN KEY (ma_kh) REFERENCES public.khach_hang_si(ma_kh) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cong_no_ma_ncc') THEN
    ALTER TABLE public.cong_no ADD CONSTRAINT fk_cong_no_ma_ncc
      FOREIGN KEY (ma_ncc) REFERENCES public.nha_cung_cap(ma_ncc) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cong_no_ma_xuong ON public.cong_no(ma_xuong);
CREATE INDEX IF NOT EXISTS idx_cong_no_ma_kh ON public.cong_no(ma_kh);
CREATE INDEX IF NOT EXISTS idx_cong_no_ma_ncc ON public.cong_no(ma_ncc);
CREATE INDEX IF NOT EXISTS idx_cong_no_ma_lenh ON public.cong_no(ma_lenh);

-- ===================================================================
-- BUOC 3: TRIGGER TU DONG KHOA USER KHI NV NGHỉ VIỆC
-- ===================================================================

-- Function: khi update nhan_su.trang_thai thanh 'da_nghi' -> disable auth user
CREATE OR REPLACE FUNCTION public.handle_nhan_su_nghi_viec()
RETURNS TRIGGER AS $$
BEGIN
  -- Neu trang thai chuyen sang da_nghi va co user_id -> disable user trong auth
  IF NEW.trang_thai = 'da_nghi' AND OLD.trang_thai <> 'da_nghi' AND NEW.user_id IS NOT NULL THEN
    -- Ban thanh vien auth user (khong cho login nua)
    UPDATE auth.users
    SET banned_until = '2099-12-31 23:59:59+00',
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Log audit
    INSERT INTO public.audit_logs (action, table_name, record_id, user_id, created_at, details)
    VALUES (
      'AUTO_DISABLE_USER',
      'nhan_su',
      NEW.ma_nv,
      auth.uid(),
      NOW(),
      jsonb_build_object(
        'reason', 'nhan_su_nghi_viec',
        'ngay_nghi', NEW.ngay_nghi_viec,
        'auth_user_id', NEW.user_id
      )
    );
  END IF;

  -- Neu tu 'da_nghi' -> 'dang_lam' (tai ky) -> enable user
  IF NEW.trang_thai = 'dang_lam' AND OLD.trang_thai = 'da_nghi' AND NEW.user_id IS NOT NULL THEN
    UPDATE auth.users
    SET banned_until = NULL,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trg_nhan_su_auto_disable_user ON public.nhan_su;
CREATE TRIGGER trg_nhan_su_auto_disable_user
  AFTER UPDATE OF trang_thai ON public.nhan_su
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_nhan_su_nghi_viec();

-- ===================================================================
-- BUOC 4: RLS POLICIES (cho cac bang moi tao)
-- ===================================================================

-- 4a. Enable RLS + policies cho xuong_gia_cong
ALTER TABLE public.xuong_gia_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_xuong_gia_cong" ON public.xuong_gia_cong;
DROP POLICY IF EXISTS "auth_write_xuong_gia_cong" ON public.xuong_gia_cong;
CREATE POLICY "anon_read_xuong_gia_cong" ON public.xuong_gia_cong FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_xuong_gia_cong" ON public.xuong_gia_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4b. khach_hang_si
ALTER TABLE public.khach_hang_si ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_khach_hang_si" ON public.khach_hang_si;
DROP POLICY IF EXISTS "auth_write_khach_hang_si" ON public.khach_hang_si;
CREATE POLICY "anon_read_khach_hang_si" ON public.khach_hang_si FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_khach_hang_si" ON public.khach_hang_si FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4c. kho
ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_kho" ON public.kho;
DROP POLICY IF EXISTS "auth_write_kho" ON public.kho;
CREATE POLICY "anon_read_kho" ON public.kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_kho" ON public.kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4d. giao_dich_kho
ALTER TABLE public.giao_dich_kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_gd_kho" ON public.giao_dich_kho;
DROP POLICY IF EXISTS "auth_write_gd_kho" ON public.giao_dich_kho;
CREATE POLICY "anon_read_gd_kho" ON public.giao_dich_kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_gd_kho" ON public.giao_dich_kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4e. phan_cong
ALTER TABLE public.phan_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_phan_cong" ON public.phan_cong;
DROP POLICY IF EXISTS "auth_write_phan_cong" ON public.phan_cong;
CREATE POLICY "anon_read_phan_cong" ON public.phan_cong FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_phan_cong" ON public.phan_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===================================================================
-- BUOC 5: CAP NHAT TRIGGER tu dong tinh con_lai cho xuong_gia_cong
-- ===================================================================
CREATE OR REPLACE FUNCTION public.update_xuong_cong_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.con_lai = NEW.cong_no - NEW.da_thanh_toan;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_xuong_gia_cong_cong_no ON public.xuong_gia_cong;
CREATE TRIGGER trg_xuong_gia_cong_cong_no
  BEFORE INSERT OR UPDATE OF cong_no, da_thanh_toan ON public.xuong_gia_cong
  FOR EACH ROW
  EXECUTE FUNCTION public.update_xuong_cong_no();

-- ===================================================================
-- BUOC 6: VERIFY
-- ===================================================================
SELECT 'xuong_gia_cong' as table_name, COUNT(*) as rows FROM public.xuong_gia_cong
UNION ALL SELECT 'khach_hang_si', COUNT(*) FROM public.khach_hang_si
UNION ALL SELECT 'kho', COUNT(*) FROM public.kho
UNION ALL SELECT 'giao_dich_kho', COUNT(*) FROM public.giao_dich_kho
UNION ALL SELECT 'phan_cong', COUNT(*) FROM public.phan_cong
UNION ALL SELECT 'nhan_su', COUNT(*) FROM public.nhan_su
UNION ALL SELECT 'lenh_cat', COUNT(*) FROM public.lenh_cat
UNION ALL SELECT 'cong_no', COUNT(*) FROM public.cong_no;

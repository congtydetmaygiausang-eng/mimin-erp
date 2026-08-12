-- ==============================================================================
-- SCRIPT BỔ SUNG FOREIGN KEY KẾT NỐI CÁC BẢNG (SUPABASE)
-- Kết nối hoá đơn điện tử với đơn hàng và khách hàng
-- ==============================================================================

-- 1. Kết nối hoa_don_dien_tu -> don_hang
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hddt_don_hang') THEN
    -- Nếu cột id của don_hang là text, và ref_id_don_hang cũng là text
    ALTER TABLE public.hoa_don_dien_tu 
      ADD CONSTRAINT fk_hddt_don_hang 
      FOREIGN KEY (ref_id_don_hang) REFERENCES public.don_hang(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Không thể tạo khoá ngoại fk_hddt_don_hang: %', SQLERRM;
END $$;

-- 2. Đảm bảo bảng giao_dich_kho kết nối với don_hang (nếu cần)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gd_kho_ma_lenh') THEN
    ALTER TABLE public.giao_dich_kho 
      ADD CONSTRAINT fk_gd_kho_ma_lenh 
      FOREIGN KEY (ma_lenh) REFERENCES public.don_hang(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Không thể tạo khoá ngoại fk_gd_kho_ma_lenh: %', SQLERRM;
END $$;

-- ==============================================================================
-- MIMIN ERP - XOÁ SẠCH DỮ LIỆU VẬN HÀNH (Về trạng thái số 0)
-- Chạy file này trong SQL Editor của Supabase
-- ==============================================================================
--
-- ✅ GIỮ NGUYÊN (Master Data):
--   nhan_su, nha_cung_cap, khach_hang, san_pham, gia_cong
--
-- ❌ XOÁ TRẮNG (Dữ liệu vận hành):
--   lenh_cat, don_hang, phan_cong, giao_dich_kho
--   khsx, giao_hang, hoan_thien, qc_records, doi_soat, kho_mobile
-- ==============================================================================

-- Tắt FK tạm thời để TRUNCATE không bị chặn bởi ràng buộc
SET session_replication_role = replica;

TRUNCATE TABLE public.lenh_cat;
TRUNCATE TABLE public.don_hang;
TRUNCATE TABLE public.phan_cong;
TRUNCATE TABLE public.giao_dich_kho;

-- Các bảng phụ (chỉ xoá nếu tồn tại - dùng DO block để an toàn)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='khsx') THEN
    TRUNCATE TABLE public.khsx;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='giao_hang') THEN
    TRUNCATE TABLE public.giao_hang;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='hoan_thien') THEN
    TRUNCATE TABLE public.hoan_thien;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='qc_records') THEN
    TRUNCATE TABLE public.qc_records;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='doi_soat') THEN
    TRUNCATE TABLE public.doi_soat;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='kho_mobile') THEN
    TRUNCATE TABLE public.kho_mobile;
  END IF;
END $$;

-- Bật lại FK
SET session_replication_role = DEFAULT;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Xoá sạch dữ liệu vận hành thành công! Sẵn sàng nhập liệu thật.';
  RAISE NOTICE '✅ Master Data (Nhân Sự, NCC, Khách Hàng, Sản Phẩm) vẫn được giữ nguyên.';
END $$;

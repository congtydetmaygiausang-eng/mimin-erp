-- ==============================================================================
-- MIMIN ERP - BẢN VÁ LỖI DATABASE TRƯỚC KHI LÊN PRODUCTION (2026-08-23)
-- Xử lý dứt điểm các lỗi thiếu cột và lỗi khóa ngoại
-- ==============================================================================

-- 1. Sửa lỗi bảng don_hang thiếu các cột dia_chi và items
ALTER TABLE public.don_hang 
  ADD COLUMN IF NOT EXISTS dia_chi TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB;

-- 2. Sửa lỗi khóa ngoại fk_phan_cong_lenh_cat trên bảng phan_cong
-- Trước tiên, xóa khóa ngoại bị lỗi (nếu có)
ALTER TABLE public.phan_cong
  DROP CONSTRAINT IF EXISTS fk_phan_cong_lenh_cat;

-- Sau đó dọn dẹp các bản ghi rác trong phan_cong mà không trỏ tới lenh_cat hợp lệ
DELETE FROM public.phan_cong 
  WHERE ma_lenh_cat IS NOT NULL 
  AND ma_lenh_cat NOT IN (SELECT id FROM public.lenh_cat);

-- Tạo lại khóa ngoại an toàn
ALTER TABLE public.phan_cong
  ADD CONSTRAINT fk_phan_cong_lenh_cat
  FOREIGN KEY (ma_lenh_cat) 
  REFERENCES public.lenh_cat(id) 
  ON DELETE CASCADE;

-- In ra thông báo thành công
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Đã vá lỗi Database thành công! Hệ thống sẵn sàng cho dữ liệu thực.';
END $$;

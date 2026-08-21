-- ============================================
-- MODULE DỆT NHUỘM MỚI - thay thế 5 module cũ (yarn-production-chain,
-- yarn-weaving-dyeing, yarn-warehouse, yarn-inventory, yarn-me-soi-engine)
-- Chạy thủ công trên Supabase SQL Editor - KHÔNG tự động chạy từ code.
-- ============================================
--
-- BỐI CẢNH: 5 module Sợi-Dệt-Nhuộm cũ chạy 100% localStorage (không đụng
-- Supabase thật, trừ 1 đường ghi gián tiếp không đáng tin cậy qua bảng
-- "kho"), không route nào trong 5 trang liên quan được nối vào menu chính -
-- xác nhận AN TOÀN để thay thế hoàn toàn, không mất dữ liệu thật nào.
--
-- THIẾT KẾ: 3 bảng theo đúng 3 công đoạn (Nhập sợi -> Giao dệt -> Giao
-- nhuộm), có ĐỊNH MỨC HAO HỤT ngay từ đầu (không phải thêm sau) theo đúng
-- yêu cầu. KHÔNG tạo thêm bảng kho/công nợ/audit riêng - dùng lại đúng 3
-- "nguồn sự thật chung" đã có sẵn trong hệ thống:
--   - Tồn kho vải thành phẩm -> giao_dich_kho (bảng thật, dùng chung với
--     kho-vai-tinhmann)
--   - Công nợ NCC sợi / xưởng dệt / xưởng nhuộm -> nha_cung_cap.cong_no
--     (field thật, dùng chung với trang nhà cung cấp / đối tác gia công)
--   - Nhật ký thao tác -> logAudit() (đã có sẵn trong code, không cần bảng riêng)
-- Tránh lặp lại đúng lỗi "5 module trùng lặp" đang muốn sửa.

-- ============================================
-- 1. NHẬP SỢI (nguyên liệu đầu vào)
-- ============================================
CREATE TABLE IF NOT EXISTS public.det_nhuom_nhap_soi (
  id text PRIMARY KEY,
  ncc_id text REFERENCES public.nha_cung_cap(id),
  ncc_ten text,               -- lưu kèm tên NCC lúc nhập, tránh vỡ hiển thị nếu NCC bị đổi tên sau
  loai_soi text NOT NULL,
  kg numeric NOT NULL DEFAULT 0,
  gia numeric NOT NULL DEFAULT 0,        -- đơn giá / kg
  thanh_tien numeric NOT NULL DEFAULT 0, -- kg * gia
  ma_phieu text,
  anh_chung_tu text,          -- URL ảnh chứng từ (optional)
  ngay date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_tao text,             -- nhan_su.ma_nv
  ghi_chu text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. GIAO DỆT (sợi -> vải mộc) - có định mức hao hụt
-- ============================================
CREATE TABLE IF NOT EXISTS public.det_nhuom_giao_det (
  id text PRIMARY KEY,
  nhap_soi_id text REFERENCES public.det_nhuom_nhap_soi(id),
  xuong_id text REFERENCES public.nha_cung_cap(id),
  xuong_ten text,
  kg_vao numeric NOT NULL DEFAULT 0,     -- sợi giao xưởng dệt
  kg_ra numeric NOT NULL DEFAULT 0,      -- vải mộc nhận về
  cay integer DEFAULT 0,                 -- số cây vải mộc
  gia_det numeric NOT NULL DEFAULT 0,    -- đơn giá dệt / kg (tính trên kg_ra)
  dinh_muc_hao_hut numeric NOT NULL DEFAULT 2,  -- % cho phép (dệt thường 1-3%)
  hao_hut_thuc_te numeric,               -- (kg_vao-kg_ra)/kg_vao*100, tính ở app lúc lưu
  vuot_dinh_muc boolean DEFAULT false,
  tien_phat_hao_hut numeric DEFAULT 0,   -- phạt nếu vượt định mức (trừ vào công nợ xưởng)
  chung_tu_url text,                     -- ảnh biên bản giao nhận / xác nhận mộc
  nguoi_phu_trach text,                  -- nhan_su.ma_nv
  ngay date NOT NULL DEFAULT CURRENT_DATE,
  ghi_chu text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. GIAO NHUỘM (vải mộc -> vải thành phẩm) - có định mức hao hụt
-- ============================================
CREATE TABLE IF NOT EXISTS public.det_nhuom_giao_nhuom (
  id text PRIMARY KEY,
  giao_det_id text REFERENCES public.det_nhuom_giao_det(id),
  xuong_id text REFERENCES public.nha_cung_cap(id),
  xuong_ten text,
  mau text NOT NULL,
  cay integer DEFAULT 0,
  kg_gui numeric NOT NULL DEFAULT 0,     -- mộc gửi nhuộm
  kg_tp numeric NOT NULL DEFAULT 0,      -- thành phẩm nhận về
  gia numeric NOT NULL DEFAULT 0,        -- đơn giá nhuộm / kg (tính trên kg_tp)
  kho text DEFAULT 'vai',                -- khớp loai_kho của giao_dich_kho ("vai"/"phu-lieu")
  dinh_muc_hao_hut numeric NOT NULL DEFAULT 5,  -- % cho phép (nhuộm thường 3-8%)
  hao_hut_thuc_te numeric,
  vuot_dinh_muc boolean DEFAULT false,
  tien_phat_hao_hut numeric DEFAULT 0,
  da_nhap_kho boolean DEFAULT false,     -- đã ghi vào giao_dich_kho + công nợ chưa (tránh ghi trùng)
  ma_vt_kho text,                        -- mã vật tư dùng khi ghi vào giao_dich_kho
  chung_tu_url text,                     -- hình test màu / biên bản nhận thành phẩm
  nguoi_phu_trach text,
  ngay date NOT NULL DEFAULT CURRENT_DATE,
  ghi_chu text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. SỔ GHI CHI PHÍ (tóm tắt mỗi lần "Xác nhận nhập kho") - phục vụ tra cứu/
--    báo cáo giá vốn, KHÔNG thay thế nha_cung_cap.cong_no (vẫn là nguồn công
--    nợ chính - bảng này chỉ lưu lại "ảnh chụp" số liệu tại thời điểm xác nhận).
-- ============================================
CREATE TABLE IF NOT EXISTS public.det_nhuom_cost_ledger (
  id text PRIMARY KEY,
  giao_nhuom_id text REFERENCES public.det_nhuom_giao_nhuom(id),
  ma_phieu text,
  tong_tien_soi numeric DEFAULT 0,
  tong_tien_det numeric DEFAULT 0,
  tong_tien_nhuom numeric DEFAULT 0,
  tong_tien_phat_hao_hut numeric DEFAULT 0,
  gia_von_moi_kg numeric DEFAULT 0,      -- (tong_tien_soi+det+nhuom) / kg_tp - dùng làm don_gia khi ghi giao_dich_kho
  tong_thanh_toan numeric DEFAULT 0,
  nguoi_tao text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- GRANT + RLS - theo đúng pattern các bảng nghiệp vụ khác trong hệ thống
-- (anon/authenticated đọc-ghi tự do vì tài khoản demo chưa có Supabase Auth
-- thật - xem FIX-RLS-AUDIT-2026-08-20.sql mục "CHỦ ĐỘNG KHÔNG SỬA" để hiểu
-- vì sao chưa siết theo auth.uid(); service_role cần GRANT rõ ràng như đã
-- vá cho users/giao_dich_kho/nhan_su/phan_cong/nha_cung_cap trước đó).
-- ============================================
ALTER TABLE public.det_nhuom_nhap_soi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.det_nhuom_giao_det ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.det_nhuom_giao_nhuom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.det_nhuom_cost_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all_access" ON public.det_nhuom_nhap_soi;
CREATE POLICY "all_access" ON public.det_nhuom_nhap_soi FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "all_access" ON public.det_nhuom_giao_det;
CREATE POLICY "all_access" ON public.det_nhuom_giao_det FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "all_access" ON public.det_nhuom_giao_nhuom;
CREATE POLICY "all_access" ON public.det_nhuom_giao_nhuom FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "all_access" ON public.det_nhuom_cost_ledger;
CREATE POLICY "all_access" ON public.det_nhuom_cost_ledger FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.det_nhuom_nhap_soi TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.det_nhuom_giao_det TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.det_nhuom_giao_nhuom TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.det_nhuom_cost_ledger TO service_role, anon, authenticated;

-- ============================================
-- VERIFY (chạy sau khi áp dụng)
-- ============================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema='public' AND table_name LIKE 'det_nhuom_%';
-- Kỳ vọng: 4 bảng det_nhuom_nhap_soi/giao_det/giao_nhuom/cost_ledger.

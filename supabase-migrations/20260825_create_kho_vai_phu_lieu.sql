-- MIMIN ERP - Kho vai va Kho phu lieu
-- Generated from apps/web/src/lib/data/real-data.ts
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  ten_vt TEXT NOT NULL,
  loai TEXT NOT NULL,
  loai_chi_tiet TEXT,
  mau_sac TEXT,
  dvt TEXT DEFAULT 'kg',
  don_gia NUMERIC(12,0) DEFAULT 0,
  ton_kho NUMERIC(12,2) DEFAULT 0,
  ton_toi_thieu NUMERIC(12,2) DEFAULT 0,
  so_cay_nhap NUMERIC(12,2) DEFAULT 0,
  ton_cay NUMERIC(12,2) DEFAULT 0,
  ma_ncc TEXT,
  ty_le_hao_hut NUMERIC(5,2) DEFAULT 0,
  kho TEXT DEFAULT 'Kho chính',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ten_vt TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS loai TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS loai_chi_tiet TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS mau_sac TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS dvt TEXT DEFAULT 'kg';
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS don_gia NUMERIC(12,0) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ton_kho NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ton_toi_thieu NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS so_cay_nhap NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ton_cay NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ty_le_hao_hut NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS kho TEXT DEFAULT 'Kho chính';
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS ghi_chu TEXT;
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.kho ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_kho_sku ON public.kho(sku);
CREATE INDEX IF NOT EXISTS idx_kho_loai ON public.kho(loai);
CREATE INDEX IF NOT EXISTS idx_kho_kho ON public.kho(kho);

INSERT INTO public.kho (
  sku, ten_vt, loai, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho,
  ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu
) VALUES
  ('V-XAMCHI035', 'XÁM CHÌ 035', 'Vai', 'Vải', 'Xám chì', 'kg', 74000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XANHDENCM', 'XANH ĐEN CM', 'Vai', 'Vải', 'Xanh đen', 'kg', 96000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-MAU11', 'MÀU 11', 'Vai', 'Vải', 'Màu 11', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAM6', 'XÁM 6 ( 005)', 'Vai', 'Vải', 'Xám', 'kg', 67500, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-BO068', 'BÒ (068) 26', 'Vai', 'Vải', 'Bò', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMMON109', 'XÁM MÔN 109', 'Vai', 'Vải', 'Xám môn', 'kg', 0, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-DAUXANH114', 'ĐẬU XANH 114', 'Vai', 'Vải', 'Đậu xanh', 'kg', 0, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-DO112', 'ĐỎ 112', 'Vai', 'Vải', 'Đỏ', 'kg', 96000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMXANH111', 'XÁM XANH 111', 'Vai', 'Vải', 'Xám xanh', 'kg', 0, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-TRANG003', 'TRẮNG 003(1)', 'Vai', 'Vải', 'Trắng', 'kg', 69000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-COUA044', 'CỔ UẢ 044', 'Vai', 'Vải', 'Cổ uả', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XANHNGOC', 'XANH NGỌC', 'Vai', 'Vải', 'Xanh ngọc', 'kg', 0, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XANHBICH', 'VẢI XANH BÍCH', 'Vai', 'Vải', 'Xanh bích', 'kg', 91000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMLO061', 'XÁM LỢT 061', 'Vai', 'Vải', 'Xám lợt', 'kg', 72000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-KEM3', 'KEM 3', 'Vai', 'Vải', 'Kem', 'kg', 69000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-CACAO21', 'CACAO 21', 'Vai', 'Vải', 'Cacao', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMCHI066', 'XÁM CHÌ 066 ( 20 )', 'Vai', 'Vải', 'Xám chì', 'kg', 74000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-DAXANH', 'ĐÁ XANH', 'Vai', 'Vải', 'Đá xanh', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMTRANG2', 'XÁM TRẮNG 2', 'Vai', 'Vải', 'Xám trắng', 'kg', 64000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XANHDENTH', 'XANH ĐEN THƯỜNG', 'Vai', 'Vải', 'Xanh đen', 'kg', 69000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-VANG14', 'VÀNG 14', 'Vai', 'Vải', 'Vàng', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMCHI035N', 'Poly Nano Xám 035', 'Vai', 'Vải', 'Xám', 'kg', 70000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-DENNANO', 'Poly Nano Đen', 'Vai', 'Vải', 'Đen', 'kg', 91000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAMNANO', 'Poly Nano Xám', 'Vai', 'Vải', 'Xám', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-REUNANO', 'Poly Nano Rêu', 'Vai', 'Vải', 'Rêu', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-2DADEN', 'VẢI 2DA ĐEN', 'Vai', 'Vải', 'Đen', 'kg', 69000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-2DAREU', 'VẢI 2DA RÊU', 'Vai', 'Vải', 'Rêu', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-2DANAU', 'VẢI 2DA NÂU ĐẤT', 'Vai', 'Vải', 'Nâu đất', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-2DAXAMCHI', 'VẢI 2DA XÁM CHÌ', 'Vai', 'Vải', 'Xám chì', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-GUNG040', 'GỪNG 040', 'Vai', 'Vải', 'Gừng', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-BEIGE5V7036', 'BEIGE 5V7036', 'Vai', 'Vải', 'Beige', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-REU036', 'RÊU 036', 'Vai', 'Vải', 'Rêu', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-COVIT012', 'CỔ VỊT 012', 'Vai', 'Vải', 'Cổ vịt', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-DENCAMMAU', 'ĐEN CẦM MÀU', 'Vai', 'Vải', 'Đen', 'kg', 96000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XAM81', 'XÁM 81', 'Vai', 'Vải', 'Xám', 'kg', 72000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-XANHNHOT069', 'XANH NHỚT 069 (28)', 'Vai', 'Vải', 'Xanh nhớt', 'kg', 75000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-KEM108', 'KEM 108', 'Vai', 'Vải', 'Kem', 'kg', 71000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải chính'),
  ('V-COTTON100-TRANG', 'VẢI COTTON 100% TRẮNG', 'Vai', 'Vải', 'Trắng', 'kg', 85000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải mới thêm'),
  ('V-CASAUDEN', 'VẢI CÁ SẤU ĐEN', 'Vai', 'Vải', 'Đen', 'kg', 95000, 0, 0, 0, 0, 0, 'Kho vải', 'Vải mới thêm'),
  ('BO-001', 'Bo Cổ Trơn - TRẮNG 003(1)', 'Phu lieu', 'Bo cổ', 'TRẮNG 003', 'bộ', 6000, 1524, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-002', 'Bo Cổ Trơn - KEM', 'Phu lieu', 'Bo cổ', 'KEM', 'bộ', 6000, 480, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-003', 'Bo Cổ Trơn - KEM 108', 'Phu lieu', 'Bo cổ', 'KEM 108', 'bộ', 6000, 480, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-004', 'Bo Cổ Trơn - GỪNG 040', 'Phu lieu', 'Bo cổ', 'GỪNG 040', 'bộ', 6000, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-005', 'Bo Cổ Trơn - BEIGE 5V7036', 'Phu lieu', 'Bo cổ', 'BEIGE 5V7036', 'bộ', 6000, 200, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-006', 'Bo Cổ Trơn - XÁM 005', 'Phu lieu', 'Bo cổ', 'XÁM 005', 'bộ', 6000, 180, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-007', 'Bo Cổ Trơn - CỔ UẢ 044', 'Phu lieu', 'Bo cổ', 'CỔ UẢ 044', 'bộ', 6000, 67, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-008', 'Bo Cổ Trơn - XÁM XANH 90', 'Phu lieu', 'Bo cổ', 'XÁM XANH 90', 'bộ', 6000, 370, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-009', 'Bo Cổ Trơn - RÊU 036', 'Phu lieu', 'Bo cổ', 'RÊU 036', 'bộ', 6000, 70, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-010', 'Bo Cổ Trơn - XÁM CHÌ 035', 'Phu lieu', 'Bo cổ', 'XÁM CHÌ 035', 'bộ', 6000, 125, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-011', 'Bo Cổ Trơn - CỔ VỊT 012', 'Phu lieu', 'Bo cổ', 'CỔ VỊT 012', 'bộ', 6000, 65, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-012', 'Bo Cổ Trơn - ĐEN', 'Phu lieu', 'Bo cổ', 'ĐEN', 'bộ', 6000, 565, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-013', 'Bo Cổ Trơn - XÁM LỢT 061', 'Phu lieu', 'Bo cổ', 'XÁM LỢT 061', 'bộ', 6000, 240, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-014', 'Bo Cổ Trơn - XÁM 81', 'Phu lieu', 'Bo cổ', 'XÁM 81', 'bộ', 6000, 540, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-015', 'Bo Cổ Trơn - CỔ VỊT 11', 'Phu lieu', 'Bo cổ', 'CỔ VỊT 11', 'bộ', 6000, 220, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-016', 'Bo Cổ Trơn - XÁM 066', 'Phu lieu', 'Bo cổ', 'XÁM 066', 'bộ', 6000, 340, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-017', 'Bo Cổ Trơn - XANH NHỚT 069', 'Phu lieu', 'Bo cổ', 'XANH NHỚT 069', 'bộ', 6000, 960, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-018', 'Bo Cổ Trơn - CA CAO 21', 'Phu lieu', 'Bo cổ', 'CA CAO 21', 'bộ', 6000, 80, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-019', 'Bo Cổ Trơn - XÁM MÔN', 'Phu lieu', 'Bo cổ', 'XÁM MÔN', 'bộ', 6000, 230, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-020', 'Bo Cổ Trơn - ĐỎ', 'Phu lieu', 'Bo cổ', 'ĐỎ', 'bộ', 6000, 40, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-021', 'Bo Cổ Trơn - XANH ĐEN', 'Phu lieu', 'Bo cổ', 'XANH ĐEN', 'bộ', 6000, 460, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-022', 'Bo Cổ Trơn - BÒ 068', 'Phu lieu', 'Bo cổ', 'BÒ 068', 'bộ', 6000, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-023', 'Bo Cổ 2 da trắng sọc xanh đen tay trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 360, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-024', 'Bo Cổ 2 da trắng sọc xanh đen tay đen', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 400, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-025', 'Bo Cổ 2 da trắng sọc đen+gừng tay đen', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 220, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-026', 'Bo Cổ 2 da trắng sọc đen+gừng tay trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 350, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-027', 'Bo Cổ 2 da trắng sọc đen+gừng tay kem', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 200, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-028', 'Bo Cổ 2 da gừng sọc đen tay gừng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 90, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-029', 'Bo Cổ 2 da trắng sọc đen tay đen', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 110, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-030', 'Bo Cổ 2 da đen sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 7200, 450, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-031', 'Bo trắng sọc đỏ', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 200, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-032', 'Bo trắng sọc đỏ+xanh', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 240, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-033', 'Bo đỏ +2 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 100, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-034', 'Bo xám chì 035 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 240, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-035', 'Bo đen 2 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 100, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-036', 'Bo xanh đen sọc trắng đỏ', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 240, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-037', 'Bo đỏ 2 sọc trắng xanh lá', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 170, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-038', 'Bo 1 sọc xám 005 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 135, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-039', 'Bo 1 sọc xám 035 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 110, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-040', 'Bo 1 sọc xanh nhớt 069 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 120, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-041', 'Bo 2 sọc nhí rêu 036 sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 90, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-042', 'Bo 2 sọc nhí đen sọc gừng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 140, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-043', 'Bo 1 sọc nhí ca cao sọc bò 068', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 370, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-044', 'Bo 1 sọc nhí xanh đen sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 60, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-045', 'Bo 1 sọc nhí cỏ úa sọc trắng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 250, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-046', 'Bo 1 sọc nhí gừng sọc đen', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 150, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BO-047', 'Bo 1 sọc nhí đen sọc gừng', 'Phu lieu', 'Bo cổ', '(Nhiều màu)', 'bộ', 6000, 60, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BAOBI_GIAY', 'Bao bì + Giấy', 'Phu lieu', 'Phụ liệu', '', 'sp', 700, 0, 0, 0, 0, 0, 'Kho phụ liệu', 'Chi phí cố định'),
  ('THEBAI', 'Thẻ bài', 'Phu lieu', 'Phụ liệu', '', 'sp', 700, 0, 0, 0, 0, 0, 'Kho phụ liệu', 'Chi phí cố định'),
  ('DAYKEO', 'Dây kéo', 'Phu lieu', 'Phụ liệu', '', 'sp', 1400, 0, 0, 0, 0, 0, 'Kho phụ liệu', 'Chi phí cố định'),
  ('THUNQUAN', 'Thun quần', 'Phu lieu', 'Phụ liệu', '', 'sp', 1500, 0, 0, 0, 0, 0, 'Kho phụ liệu', 'Chi phí cố định'),
  ('NUT-035', 'Nút Xám Chì 035', 'Phu lieu', 'Nút', 'Xám chì', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-069', 'Nút Xanh Nhớt 069', 'Phu lieu', 'Nút', 'Xanh nhớt', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-066', 'Nút Xám 066', 'Phu lieu', 'Nút', 'Xám', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-GUNG', 'Nút Gừng', 'Phu lieu', 'Nút', 'Gừng', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-COUA', 'Nút Cổ Úa', 'Phu lieu', 'Nút', 'Cổ úa', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-068', 'Nút Bò 068', 'Phu lieu', 'Nút', 'Bò', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-108', 'Nút Kem 108', 'Phu lieu', 'Nút', 'Kem', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-COVIT', 'Nút Cổ Vịt', 'Phu lieu', 'Nút', 'Cổ vịt', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-036', 'Nút Rêu 036', 'Phu lieu', 'Nút', 'Rêu', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-TRANG', 'Nút Trắng', 'Phu lieu', 'Nút', 'Trắng', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-XANHDEN', 'Nút Xanh Đen', 'Phu lieu', 'Nút', 'Xanh đen', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-DEN', 'Nút Đen', 'Phu lieu', 'Nút', 'Đen', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-061', 'Nút Xám Lợt 061', 'Phu lieu', 'Nút', 'Xám lợt', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-CACAO', 'Nút Cacao', 'Phu lieu', 'Nút', 'Cacao', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('NUT-DO', 'Nút Đỏ', 'Phu lieu', 'Nút', 'Đỏ', 'bộ', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('DAYXOMAC', 'Dây xỏ mác', 'Phu lieu', 'Phụ liệu', '', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('GIAYCOTRON', 'Giấy cổ tròn', 'Phu lieu', 'Phụ liệu', '', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('GIAYCOVUONG', 'Giấy cổ vuông', 'Phu lieu', 'Phụ liệu', '', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BOCTRANG', 'Bọc trắng', 'Phu lieu', 'Phụ liệu', 'Trắng', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BOCMIN', 'Bọc MIN', 'Phu lieu', 'Phụ liệu', '', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BOCMYLE', 'Bọc Mỹ Lệ', 'Phu lieu', 'Phụ liệu', '', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', ''),
  ('BOCKIENGDEN', 'Bọc kiếng đen', 'Phu lieu', 'Phụ liệu', 'Đen', 'sp', 0, 0, 0, 0, 0, 0, 'Kho phụ liệu', '')
ON CONFLICT (sku) DO UPDATE SET
  ten_vt = EXCLUDED.ten_vt,
  loai = EXCLUDED.loai,
  loai_chi_tiet = EXCLUDED.loai_chi_tiet,
  mau_sac = EXCLUDED.mau_sac,
  dvt = EXCLUDED.dvt,
  don_gia = EXCLUDED.don_gia,
  ton_toi_thieu = EXCLUDED.ton_toi_thieu,
  so_cay_nhap = EXCLUDED.so_cay_nhap,
  ton_cay = EXCLUDED.ton_cay,
  ty_le_hao_hut = EXCLUDED.ty_le_hao_hut,
  kho = EXCLUDED.kho,
  ghi_chu = EXCLUDED.ghi_chu,
  updated_at = NOW();

CREATE OR REPLACE VIEW public.kho_vai AS
SELECT * FROM public.kho WHERE loai = 'Vai';

CREATE OR REPLACE VIEW public.kho_phu_lieu AS
SELECT * FROM public.kho WHERE loai = 'Phu lieu';

ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_kho" ON public.kho;
DROP POLICY IF EXISTS "auth_write_kho" ON public.kho;
CREATE POLICY "anon_read_kho" ON public.kho
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_kho" ON public.kho
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.kho, public.kho_vai, public.kho_phu_lieu TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kho TO authenticated;
GRANT SELECT ON public.kho_vai, public.kho_phu_lieu TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

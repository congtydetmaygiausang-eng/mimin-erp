-- ==========================================
-- SCRIPT TẠO BẢNG CHO "KHO MẪU" (MIMIN Group)
-- Kho mẫu tái sử dụng dữ liệu sản phẩm có sẵn (bảng san_pham) làm nguồn mẫu -
-- chỉ cần thêm 1 bảng ghi lại "yêu cầu sản xuất" khi có người chọn 1 mẫu.
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.kho_mau_yeu_cau (
    id TEXT PRIMARY KEY,
    ma_sp TEXT NOT NULL,
    ten_sp TEXT NOT NULL,
    hinh_anh TEXT,
    ten_khach TEXT,
    sdt_khach TEXT,
    so_luong_yeu_cau INTEGER,
    ghi_chu TEXT,
    nguoi_gui_name TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'Mới',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.kho_mau_yeu_cau ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kho_mau_yeu_cau_authenticated" ON public.kho_mau_yeu_cau
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON public.kho_mau_yeu_cau TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kho_mau_yeu_cau TO authenticated;

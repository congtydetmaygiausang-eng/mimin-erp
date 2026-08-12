-- BẢNG PHÂN CÔNG (CÔNG NỢ CÔNG ĐOẠN)
-- Lưu thông tin giao việc cho xưởng ngoài/thợ nhà và theo dõi thanh toán/công nợ

-- Xoá bảng cũ nếu lỡ tạo sai tên cột (camelCase)
DROP TABLE IF EXISTS public.phan_cong;

-- Tạo bảng mới với snake_case chuẩn của Supabase
CREATE TABLE public.phan_cong (
    id TEXT PRIMARY KEY,
    lenh_cat_id TEXT NOT NULL,
    cong_doan TEXT NOT NULL,
    nguoi_phu_trach JSONB NOT NULL,
    don_gia_giao NUMERIC NOT NULL DEFAULT 0,
    so_luong_giao NUMERIC NOT NULL DEFAULT 0,
    don_vi TEXT NOT NULL,
    ngay_giao DATE,
    ngay_xong_du_kien DATE,
    trang_thai TEXT NOT NULL,
    da_thanh_toan NUMERIC NOT NULL DEFAULT 0,
    ghi_chu TEXT
);

-- Cho phép Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.phan_cong;

-- Cấp quyền (RLS) cho phép các role được đọc/ghi (hoặc có thể vô hiệu hóa RLS để dễ dev)
ALTER TABLE public.phan_cong DISABLE ROW LEVEL SECURITY;

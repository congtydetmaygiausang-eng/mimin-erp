-- Thêm cột giá vốn + giá bán lô cho bảng kho_thanh_pham - phục vụ nhập lô
-- hàng tồn kho hiện tại nhiều biến thể cùng lúc, mỗi biến thể có đủ giá vốn/
-- giá bán/giá bán sỉ/giá bán lẻ/giá bán lô riêng (cccd_front_url/gia_ban_le/
-- gia_ban_si đã có sẵn từ trước, chỉ thiếu 2 cột này).

alter table public.kho_thanh_pham add column if not exists gia_von numeric;
alter table public.kho_thanh_pham add column if not exists gia_ban_lo numeric;

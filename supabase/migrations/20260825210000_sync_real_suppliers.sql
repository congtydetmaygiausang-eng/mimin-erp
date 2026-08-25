-- Đồng bộ 16 NCC thật vào bảng đang chứa 20 đối tác gia công.
-- Không xóa hoặc thay đổi bất kỳ dòng GC-* nào.
BEGIN;

ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS stt integer;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS chuyen_mon text;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS ma_so_thue text;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS han_muc numeric DEFAULT 0;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS don_gia text;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE public.nha_cung_cap ADD COLUMN IF NOT EXISTS danh_muc_chi_tiet text[] DEFAULT '{}';

INSERT INTO public.nha_cung_cap (
  stt, ma_ncc, ten_ncc, loai, chuyen_mon, dia_chi, sdt, email,
  ma_so_thue, nguoi_lh, cong_no, ghi_chu, trang_thai, han_muc, rating
) VALUES
(101, 'NCC-001', 'Công ty Lucky Avanti', 'Bán sợi', 'Bán sợi', 'Quận 12, TP.HCM', '0901000000', 'luckyavanti@gmail.com', '0312456789', 'Anh Tuấn', 0, 'Sợi cotton 30s/32s/40s', 'Đang hợp tác', 300000000, 4),
(102, 'NCC-002', 'Công ty TNHH Thương mại Quốc tế Sammoon', 'Bán sợi', 'Bán sợi', 'Hóc Môn, TP.HCM', '0901012345', 'sammoon@hcm.vn', '0312456802', 'Chị Hạnh', 0, 'Sợi 30s', 'Đang hợp tác', 1000000000, 4.5),
(103, 'NCC-003', 'Công ty TNHH Sản xuất Thương mại Dệt May Hải Dương', 'Dệt', 'Dệt', 'Hải Dương', '0901024690', 'haiduong@dvm.vn', '0312456815', 'Anh Hải', 0, 'Dệt thoi 30s/32s', 'Đang hợp tác', 300000000, 4),
(104, 'NCC-004', 'Công ty TNHH Một thành viên Dệt Nhuộm Thái Thành', 'Nhuộm', 'Nhuộm', 'Bình Dương', '0901037035', 'thaithanh@bd.vn', '0312456828', 'Anh Hùng', 0, 'Nhuộm màu theo yêu cầu', 'Đang hợp tác', 300000000, 4.5),
(105, 'NCC-005', 'Công ty Cổ phần Dệt Nhuộm Phú Long', 'Bo cổ', 'Bo cổ', 'Tân Phú, TP.HCM', '0901049380', 'phulong@vnn.vn', '0312456841', 'Chị Lan', 0, 'Bo cổ và bo tay', 'Đang hợp tác', 300000000, 4),
(106, 'NCC-006', 'Hộ kinh doanh Vũ Văn Hiệp', 'Bo cổ', 'Bo cổ', 'Gò Vấp, TP.HCM', '0901061725', 'hiepvu@gmail.com', '', 'Vũ Văn Hiệp', 0, 'Bo cổ trơn các loại', 'Đang hợp tác', 300000000, 4.5),
(107, 'NCC-007', 'Công ty TNHH Phụ liệu May mặc Tường Vy', 'Phụ liệu', 'Phụ liệu', 'Quận 5, TP.HCM', '0901074070', 'tuongvy@plm.vn', '0312456867', 'Anh Tuấn', 0, 'Thun, giấy gấp xếp, bao bì', 'Đang hợp tác', 300000000, 4),
(108, 'NCC-008', 'Công ty TNHH Thương mại Dịch vụ Hằng Lữ', 'Phụ liệu', 'Phụ liệu', 'Quận 11, TP.HCM', '0901086415', 'hanglu@vnn.vn', '0312456880', 'Chị Lữ', 0, 'Dây kéo các loại', 'Đang hợp tác', 300000000, 4.5),
(109, 'NCC-009', 'Cơ sở Dây xỏ mác Bình Dương', 'Phụ liệu', 'Phụ liệu', 'Thủ Dầu Một, Bình Dương', '0901098760', 'dayxomac@bd.vn', '', 'Anh Hùng', 0, 'Dây xỏ mác', 'Đang hợp tác', 300000000, 4),
(110, 'NCC-010', 'Cơ sở Dây luồn quần Bình Dương', 'Phụ liệu', 'Phụ liệu', 'Thuận An, Bình Dương', '0901111105', 'dayluonquan@bd.vn', '', 'Chị Hà', 0, 'Dây luồn quần', 'Đang hợp tác', 300000000, 4.5),
(111, 'NCC-011', 'Công ty TNHH Sản xuất Thương mại Nhãn mác Hải Nam', 'Nhãn', 'Nhãn', 'Tân Bình, TP.HCM', '0901123450', 'hainam@label.vn', '0312456919', 'Anh Nam', 0, 'Nhãn và thẻ bài', 'Đang hợp tác', 300000000, 4),
(112, 'NCC-012', 'Công ty TNHH In ấn Thông Anh', 'In ấn', 'In ấn', 'Gò Vấp, TP.HCM', '0901135795', 'thonganh@print.vn', '0312456932', 'Chị Thông', 0, 'Nhãn size', 'Đang hợp tác', 300000000, 4.5),
(113, 'NCC-013', 'Công ty TNHH Sản xuất Kinh doanh Thương mại Bao bì Đại Hoàng Phúc', 'Túi zip', 'Túi zip', 'Bình Tân, TP.HCM', '0901148140', 'daihoangphuc@bb.vn', '0312456945', 'Anh Phúc', 0, 'Túi zip', 'Đang hợp tác', 300000000, 4),
(114, 'NCC-014', 'Công ty TNHH Dệt Bo Hải Âu', 'Bo cổ', 'Bo cổ', 'Long An', '0901160485', 'haiau@la.vn', '0312456958', 'Chị Hải', 0, 'Bo cổ trơn và bo hai da', 'Đang hợp tác', 300000000, 4.5),
(115, 'NCC-015', 'Công ty TNHH Bao bì Phúc Vinh', 'Túi zip', 'Túi zip', 'Quận 12, TP.HCM', '0901172830', 'phucvinh@bb.vn', '0312456971', 'Anh Vinh', 0, 'Bao bì PE và thùng carton', 'Đang hợp tác', 300000000, 4),
(116, 'NCC-016', 'Công ty TNHH Sản xuất Cúc nút Kim Long', 'Phụ liệu', 'Phụ liệu', 'Bình Thạnh, TP.HCM', '0901185175', 'kimlong@cuc.vn', '0312456984', 'Anh Long', 0, 'Cúc và nút các loại', 'Đang hợp tác', 300000000, 4.5)
ON CONFLICT (ma_ncc) DO UPDATE SET
  ten_ncc = EXCLUDED.ten_ncc,
  loai = EXCLUDED.loai,
  chuyen_mon = EXCLUDED.chuyen_mon,
  dia_chi = EXCLUDED.dia_chi,
  sdt = EXCLUDED.sdt,
  email = EXCLUDED.email,
  ma_so_thue = EXCLUDED.ma_so_thue,
  nguoi_lh = EXCLUDED.nguoi_lh,
  ghi_chu = EXCLUDED.ghi_chu,
  trang_thai = EXCLUDED.trang_thai,
  han_muc = EXCLUDED.han_muc,
  rating = EXCLUDED.rating;

ALTER TABLE public.nha_cung_cap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ncc_authenticated_read ON public.nha_cung_cap;
CREATE POLICY ncc_authenticated_read ON public.nha_cung_cap
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ncc_authenticated_write_suppliers ON public.nha_cung_cap;
CREATE POLICY ncc_authenticated_write_suppliers ON public.nha_cung_cap
FOR ALL TO authenticated
USING (ma_ncc ~ '^NCC-[0-9]+$' AND loai IS DISTINCT FROM 'doi_tac_gia_cong')
WITH CHECK (ma_ncc ~ '^NCC-[0-9]+$' AND loai IS DISTINCT FROM 'doi_tac_gia_cong');

GRANT SELECT, INSERT, UPDATE ON public.nha_cung_cap TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;

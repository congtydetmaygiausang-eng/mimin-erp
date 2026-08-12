-- ==============================================================================
-- UPDATE THÔNG TIN NHÂN SỰ TỪ EXCEL VÀO SUPABASE
-- Cập nhật đồng loạt các thông tin còn trống (NULL/VÔ GIÁ TRỊ) cho 17 nhân sự
-- ==============================================================================

UPDATE public.nhan_su SET 
  bhxh = '9622347690', ho_ten = 'Phạm Văn Đệ', bo_phan = 'Cắt', sdt = '0834033992', ngay_sinh = '2007-09-08', gioi_tinh = 'Nam', cccd = '096207010504', email = 'de7481039@gmail.com', dia_chi_tt = 'việt thắng, phú tân, cà mau', so_tk = '19075053256016', ngan_hang = 'Techcombank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 22/12/2021 tại ca mau. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh. SP: Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ'
WHERE ma_nv IN ('GS001', 'NV007');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN THỊ MỸ NHI', bo_phan = 'Gấp xếp', sdt = '0901207771', ngay_sinh = '2007-12-25', gioi_tinh = 'Nữ', cccd = '080307011543', email = 'Nguyennhi192145@gmail.com', dia_chi_tt = 'Ấp 4, Thạch Hưng, Tân Hưng, Long An', so_tk = '42718017', ngan_hang = 'ACB', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 29/03/2022 tại Long An. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C. SP: Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ'
WHERE ma_nv IN ('GS002', 'NV009');

UPDATE public.nhan_su SET 
  bhxh = '4420709212', ho_ten = 'VÕ THỊ PHƯỜNG', bo_phan = 'Gấp xếp', sdt = '0702501456', ngay_sinh = '1993-10-08', gioi_tinh = 'Nữ', cccd = '044193001084', email = 'vop61089@gmail.com', dia_chi_tt = 'Tổ 4, Ấp 11, Mỹ Thành Nam, Cai Lậy, Tiền Giang', so_tk = '32696157', ngan_hang = 'ACB', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 18/01/2023 tại TP.HCM. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C. SP: Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ'
WHERE ma_nv IN ('GS003', 'NV010');

UPDATE public.nhan_su SET 
  bhxh = '7936931518', ho_ten = 'NGUYỄN NGỌC CẨM VY', bo_phan = 'Content - Media', sdt = '0779182053', ngay_sinh = '2005-09-12', gioi_tinh = 'Nữ', cccd = '079305019752', email = 'nvy967300@gmail.com', dia_chi_tt = '1/12C Hưng Lân, Bà Điểm, Hóc Môn, TP.HCM', so_tk = '0779182053', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 8000000, ghi_chu = 'Cấp: 18/09/2022 tại TP.HCM. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS004', 'NV004');

UPDATE public.nhan_su SET 
  bhxh = '6422232561', ho_ten = 'ĐỖ THỊ HUYỀN', bo_phan = 'QL Khách hàng Sỉ', sdt = '0376327699', ngay_sinh = '2003-04-14', gioi_tinh = 'Nữ', cccd = '064303003705', email = 'dohuyencpr81@gmail.com', dia_chi_tt = 'Thôn Hoàng Yên, La Phìn, Chư Prông, Gia Lai', so_tk = '0376327699', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 7000000, ghi_chu = 'Cấp: 13/04/2021 tại Gia Lai. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS005', 'NV003');

UPDATE public.nhan_su SET 
  bhxh = '3622387273', ho_ten = 'BÙI THỊ THANH', bo_phan = 'Kế toán điều phối SX', sdt = '0911546004', ngay_sinh = '1999-11-15', gioi_tinh = 'Nữ', cccd = '036199016242', email = 'buithanh151199@gmail.com', dia_chi_tt = 'Xã Yên Cường, Ninh Bình', so_tk = '0911546004', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 8000000, ghi_chu = 'Cấp: 06/12/2024 tại Nam Định. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS006', 'NV002');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN THỊ BÉ', bo_phan = 'Gấp xếp', sdt = '0363073998', ngay_sinh = '1979-05-15', gioi_tinh = 'Nữ', cccd = '083179005680', email = 'beekhuong1505@gmail.com', dia_chi_tt = 'Ấp Thanh Thủy, Đồng Khởi, Vĩnh Long', so_tk = '060260103434', ngan_hang = 'Sacombank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 24/10/2025 tại Vĩnh Long. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ'
WHERE ma_nv IN ('GS007', 'NV019');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'HUỲNH XUÂN HÒA', bo_phan = 'Media', sdt = '0334536752', ngay_sinh = '2004-03-16', gioi_tinh = 'Nam', cccd = '052204008944', email = 'xhoa14052004@gmail.com', dia_chi_tt = 'An Hòa, Nhơn Khánh, An Phơn, Bình Định', so_tk = '1502160304444', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 10000000, ghi_chu = 'Cấp: 18/1/2021 tại Cục Cảnh sát. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS008', 'NV020');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN MINH ĐỨC', bo_phan = 'Ủi', sdt = '0365052474', ngay_sinh = '1990-09-14', gioi_tinh = 'Nam', cccd = '079090017117', email = 'nguyenminhduc199024@gmail.com', dia_chi_tt = '02 Đường số 19, Tân Định, Tân Thông Hội, Củ Chi', so_tk = '0365052474', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 5/9/2022 tại Củ Chi. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ'
WHERE ma_nv IN ('GS009', 'NV021');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'TRƯƠNG MINH TÂM', bo_phan = 'Ủi', sdt = '0343513417', ngay_sinh = '1991-01-13', gioi_tinh = 'Nam', cccd = '079091026055', email = 'truongtam2044@gmail.com', dia_chi_tt = 'C9 bis, KP1, Đông Hưng Thuận, Quận 12, HCM', so_tk = '107872135480', ngan_hang = 'Vietinbank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 4/5/2021 tại HCM. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C. SP: Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ'
WHERE ma_nv IN ('GS010', 'NV022');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'LÊ ĐỊNH', bo_phan = 'Ủi', sdt = '0334047628', ngay_sinh = '2004-09-23', gioi_tinh = 'Nam', cccd = '046204008991', email = 'nan499229@gmail.com', dia_chi_tt = 'Phong Hải, Phong Điền, Thừa Thiên Huế', so_tk = NULL, ngan_hang = NULL, trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Thiếu CCCD, SĐT. Cấp: Cục Cảnh sát. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ'
WHERE ma_nv IN ('GS011', 'NV023');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'DƯƠNG TẤN VĨNH', bo_phan = 'Cắt', sdt = '0392123831', ngay_sinh = '2005-01-31', gioi_tinh = 'Nam', cccd = '089205009111', email = 'duongvinh3102005@gmail.com', dia_chi_tt = 'An Thạnh Chung, Chợ Mới, An Giang', so_tk = '6711281019530', ngan_hang = 'Agribank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 10/8/2021 tại An Giang. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ'
WHERE ma_nv IN ('GS012', 'NV024');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN QUỐC MINH', bo_phan = 'Cắt', sdt = '0332026731', ngay_sinh = '2009-11-13', gioi_tinh = 'Nam', cccd = '091209019977', email = '', dia_chi_tt = 'An Thạnh, An Phú, An Giang', so_tk = '0332026731', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: An Giang. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C. SP: Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ'
WHERE ma_nv IN ('GS013', 'NV025');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'TRƯƠNG VĂN NHẪN', bo_phan = 'Cắt', sdt = '0345141953', ngay_sinh = '2009-02-14', gioi_tinh = 'Nam', cccd = '094209008345', email = 'trvannhan1402@gmail.com', dia_chi_tt = 'Khóm Tân Thành, Phường 2, Ngã Năm, Sóc Trăng', so_tk = '0365323187', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 6/6/2023 tại Sóc Trăng. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ'
WHERE ma_nv IN ('GS014', 'NV026');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN QUỐC HẬU', bo_phan = 'Nhân viên Kho', sdt = '0386231456', ngay_sinh = '1997-04-11', gioi_tinh = 'Nam', cccd = '079097033092', email = 'Beo26032019@gmail.com', dia_chi_tt = '29/2E Ấp Đông Lân, Bà Điểm, HCM', so_tk = '0386231456', ngan_hang = 'MBBank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 7000000, ghi_chu = 'Cấp: 26/11/2025 tại HCM. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS015', 'NV005');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'LƯƠNG HOÀNG PHI', bo_phan = 'Media', sdt = '0938625594', ngay_sinh = '1994-05-22', gioi_tinh = 'Nam', cccd = '079094005478', email = 'fizxnm2251994@mail.com', dia_chi_tt = '312/37 Gò Dầu, Tân Sơn Nhì, HCM', so_tk = '0938625594', ngan_hang = 'Shinhanbank', trang_thai = 'đang_lam', loai_luong = 'Lương cứng', luong_cb = 0, ghi_chu = 'Chưa phân công, thiếu thông tin. Cấp: HCM. Tạm trú: 12/39 Đường Xuân Thới Thượng 58C.'
WHERE ma_nv IN ('GS016', 'NV027');

UPDATE public.nhan_su SET 
  bhxh = NULL, ho_ten = 'NGUYỄN VĂN RUỘNG', bo_phan = 'Khuy nút', sdt = '0339724459', ngay_sinh = '1987-12-22', gioi_tinh = 'Nam', cccd = '089087019874', email = 'nguyenvanruong14@gmail.com', dia_chi_tt = 'Ấp Trung Hòa, Tân Trung, Phú Tân, An Giang', so_tk = '04401016998851', ngan_hang = 'MSB', trang_thai = 'đang_lam', loai_luong = 'Lương sản phẩm', luong_cb = 0, ghi_chu = 'Cấp: 08/05/2022 tại An Giang. Tạm trú: 12/39 Đường Xuân Thới Thượng. SP: Chung: 750đ'
WHERE ma_nv IN ('GS017', 'NV017');

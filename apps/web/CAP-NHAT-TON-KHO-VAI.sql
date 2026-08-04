
-- CẬP NHẬT TỒN KHO ĐẦU KỲ CHO KHO VẢI VÀO BẢNG giao_dich_kho
-- Lấy dữ liệu 31 mã vải từ ứng dụng với số lượng tồn = 0

-- Xóa các giao dịch nhập tồn đầu kỳ cũ của Kho Vải (nếu có)
DELETE FROM giao_dich_kho WHERE loai_kho = 'vai' AND ghi_chu = 'Tồn kho đầu kỳ (từ app)';

INSERT INTO giao_dich_kho (id, ngay, ma_vt, ten_vt, loai_kho, loai, so_luong, don_gia, thanh_tien, don_vi, nguoi_thuc_hien, ghi_chu) VALUES
('c09dd945-52da-40e3-a9e8-df4b445d3d0c', '2026-08-04T17:05:39.940Z', 'V-XAMCHI035', 'XÁM CHÌ 035', 'vai', 'NHAP', 0, 70000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('40187b9c-479e-4f0c-9847-193101c6d4e0', '2026-08-04T17:05:39.940Z', 'V-XANHDENCM', 'XANH ĐEN CM', 'vai', 'NHAP', 0, 91000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('1aae623c-9c6e-411a-8c9c-46965c6c13e4', '2026-08-04T17:05:39.940Z', 'V-MAU11', 'MÀU 11', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('02e9051a-059c-4829-8e57-6c2bbbc338d9', '2026-08-04T17:05:39.940Z', 'V-XAM6', 'XÁM 6 ( 005)', 'vai', 'NHAP', 0, 67500, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('029bf4a0-f941-4b38-966b-f9b73e19c521', '2026-08-04T17:05:39.940Z', 'V-BO068', 'BÒ (068) 26', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('a73a6f2f-441b-40ac-a8d5-304389a6f81e', '2026-08-04T17:05:39.940Z', 'V-XAMMON109', 'XÁM MÔN 109', 'vai', 'NHAP', 0, 0, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('a6297ba0-1673-4bbb-89d3-dbd817959283', '2026-08-04T17:05:39.940Z', 'V-DAUXANH114', 'ĐẬU XANH 114', 'vai', 'NHAP', 0, 0, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('c1c9b665-1363-4e62-9a6b-9985a198b02d', '2026-08-04T17:05:39.940Z', 'V-DO112', 'ĐỎ 112', 'vai', 'NHAP', 0, 0, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('476a9e52-6b1a-4076-9cfd-92673c27cdb7', '2026-08-04T17:05:39.940Z', 'V-XAMXANH111', 'XÁM XANH 111', 'vai', 'NHAP', 0, 0, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('98b97d5f-4ff7-4056-84f6-cdaee2ef140d', '2026-08-04T17:05:39.940Z', 'V-TRANG003', 'TRẮNG 003(1)', 'vai', 'NHAP', 0, 64000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('593d2ed1-e5e8-455e-8d5e-55572874d1d3', '2026-08-04T17:05:39.940Z', 'V-COUA044', 'CỔ UẢ 044', 'vai', 'NHAP', 0, 67000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('1ae0be03-d2c5-4e0b-9d2c-a9abc43f7ed5', '2026-08-04T17:05:39.940Z', 'V-XANHNGOC', 'XANH NGỌC', 'vai', 'NHAP', 0, 0, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('006f77a9-c928-452f-8fb7-7c343ee7d09c', '2026-08-04T17:05:39.940Z', 'V-XANHBICH', 'VẢI XANH BÍCH', 'vai', 'NHAP', 0, 91000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('e22f9d10-1ab7-4779-8fa4-f8891ea0736f', '2026-08-04T17:05:39.940Z', 'V-XAMLO061', 'XÁM LỢT 061', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('ae88fa7b-6f09-49ef-bba6-6cab9acd3335', '2026-08-04T17:05:39.940Z', 'V-KEM3', 'KEM 3', 'vai', 'NHAP', 0, 64000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('7f15d21b-8d07-4e74-be7c-a6dab00c3089', '2026-08-04T17:05:39.940Z', 'V-CACAO21', 'CACAO 21', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('152786f8-7d04-4683-9818-c62ec26c412e', '2026-08-04T17:05:39.940Z', 'V-XAMCHI066', 'XÁM CHÌ 066 ( 20 )', 'vai', 'NHAP', 0, 70000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('9173818a-5971-4056-9539-22e2b075dbf1', '2026-08-04T17:05:39.940Z', 'V-DAXANH', 'ĐÁ XANH', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('92ebb190-103f-4023-84ab-fff757bea844', '2026-08-04T17:05:39.940Z', 'V-XAMTRANG2', 'XÁM TRẮNG 2', 'vai', 'NHAP', 0, 64000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('08ac1851-9afd-4cb5-9f0c-adf14e5d6892', '2026-08-04T17:05:39.940Z', 'V-XANHDENTH', 'XANH ĐEN THƯỜNG', 'vai', 'NHAP', 0, 69000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('0cd82ca7-dd42-460f-9100-6192fb4cbf1a', '2026-08-04T17:05:39.940Z', 'V-VANG14', 'VÀNG 14', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('86b491af-19fb-4f99-a614-aebc77f2adb1', '2026-08-04T17:05:39.940Z', 'V-XAMCHI035N', 'Poly Nano Xám 035', 'vai', 'NHAP', 0, 70000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('485dd4a6-d8a9-43ed-aaeb-9139cfc2c0b3', '2026-08-04T17:05:39.940Z', 'V-DENNANO', 'Poly Nano Đen', 'vai', 'NHAP', 0, 91000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('153b2dfc-3709-411f-9bf0-cbee5022a3a6', '2026-08-04T17:05:39.940Z', 'V-XAMNANO', 'Poly Nano Xám', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('0a59bba0-248d-496d-98d5-e43b50ee6774', '2026-08-04T17:05:39.940Z', 'V-REUNANO', 'Poly Nano Rêu', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('2916a491-b786-4810-a4f7-c2e9a11ed9ef', '2026-08-04T17:05:39.940Z', 'V-2DADEN', 'VẢI 2DA ĐEN', 'vai', 'NHAP', 0, 69000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('e6cb43c3-10e6-42c5-9842-c5b69a8fff11', '2026-08-04T17:05:39.940Z', 'V-2DAREU', 'VẢI 2DA RÊU', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('af72f13f-471b-4ff4-ac45-285c4c5bb44c', '2026-08-04T17:05:39.940Z', 'V-2DANAU', 'VẢI 2DA NÂU ĐẤT', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('b38fbc5a-a0a4-41aa-b65f-f9ccd3162648', '2026-08-04T17:05:39.940Z', 'V-2DAXAMCHI', 'VẢI 2DA XÁM CHÌ', 'vai', 'NHAP', 0, 71000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('f97dfa01-4e03-4702-9045-197894a0ce8f', '2026-08-04T17:05:39.940Z', 'V-COTTON100-TRANG', 'VẢI COTTON 100% TRẮNG', 'vai', 'NHAP', 0, 85000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)'),
('45c41f27-8c9c-4965-b469-8901d080e23d', '2026-08-04T17:05:39.940Z', 'V-CASAUDEN', 'VẢI CÁ SẤU ĐEN', 'vai', 'NHAP', 0, 95000, 0, 'kg', 'Hệ thống', 'Tồn kho đầu kỳ (từ app)');
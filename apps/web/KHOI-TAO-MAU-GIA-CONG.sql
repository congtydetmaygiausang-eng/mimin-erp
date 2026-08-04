-- KHỞI TẠO DỮ LIỆU MẪU CHI PHÍ VÀ MẪU CÔNG ĐOẠN

-- 1. Xóa dữ liệu cũ (nếu có)
DELETE FROM mau_chi_phi;
DELETE FROM mau_cong_doan;

-- 2. Thêm dữ liệu Mẫu Chi Phí Cố Định
INSERT INTO mau_chi_phi (id, ten, chi_phi) VALUES
('6f563f8d-790c-4740-9c97-e7812f82cc0d', 'Áo tròn', '{"BAOBI_GIAY":700,"THEBAI":700,"EPNHAN":300,"DAYKEO":0,"THUNQUAN":0,"EPKEOTRU":0}'::jsonb),
('817b79f1-dd87-4e73-b534-81628ffba0c9', 'Áo trụ', '{"BAOBI_GIAY":700,"THEBAI":700,"EPKEOTRU":300,"EPNHAN":300,"DAYKEO":0,"THUNQUAN":0}'::jsonb),
('07137c00-e032-45f3-814b-c7487bf0f42d', 'Bộ tròn', '{"BAOBI_GIAY":700,"THEBAI":700,"DAYKEO":1400,"THUNQUAN":1500,"EPNHAN":300,"EPKEOTRU":0}'::jsonb),
('e7fadebd-f804-47ae-9a8b-80e4270f7963', 'Bộ trụ', '{"BAOBI_GIAY":700,"THEBAI":700,"DAYKEO":1400,"THUNQUAN":1500,"EPKEOTRU":300,"EPNHAN":300}'::jsonb);

-- 3. Thêm dữ liệu Mẫu Công Đoạn (Quy tắc 5/6/7 bước)
INSERT INTO mau_cong_doan (id, ten, gia_cong) VALUES
('50e041a7-9d91-4460-ae30-7a4211fcc31b', 'Áo tròn', '[{"id":"cat","tenCongDoan":"Cắt áo","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"in_theu","tenCongDoan":"In/Thêu","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"may","tenCongDoan":"May áo","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"ui","tenCongDoan":"Ủi","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"dong_goi","tenCongDoan":"Đóng gói","nguoiMa":"","nguoiTen":"","donGia":0}]'::jsonb),
('3982ee05-3c21-4376-9827-e88c345d1738', 'Áo trụ', '[{"id":"cat","tenCongDoan":"Cắt áo","nguoiMa":"","nguoiTen":"","donGia":1400},{"id":"in_theu","tenCongDoan":"In/Thêu","nguoiMa":"","nguoiTen":"","donGia":1500},{"id":"may","tenCongDoan":"May áo","nguoiMa":"","nguoiTen":"","donGia":15000},{"id":"khuy_nut","tenCongDoan":"Khuy nút","nguoiMa":"","nguoiTen":"","donGia":750},{"id":"ui","tenCongDoan":"Ủi","nguoiMa":"","nguoiTen":"","donGia":900},{"id":"dong_goi","tenCongDoan":"Đóng gói","nguoiMa":"","nguoiTen":"","donGia":700}]'::jsonb),
('414ce0ed-6eda-4289-bf9b-a83110206c7f', 'Bộ tròn', '[{"id":"cat","tenCongDoan":"Cắt bộ","nguoiMa":"","nguoiTen":"","donGia":2100},{"id":"in_theu","tenCongDoan":"In/Thêu","nguoiMa":"","nguoiTen":"","donGia":6000},{"id":"may_ao","tenCongDoan":"May áo","nguoiMa":"","nguoiTen":"","donGia":7500},{"id":"may_quan","tenCongDoan":"May quần","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"khuy_nut","tenCongDoan":"Khuy nút","nguoiMa":"","nguoiTen":"","donGia":0},{"id":"ui","tenCongDoan":"Ủi","nguoiMa":"","nguoiTen":"","donGia":1400},{"id":"dong_goi","tenCongDoan":"Đóng gói","nguoiMa":"","nguoiTen":"","donGia":700}]'::jsonb),
('0a5d3408-205e-4b51-a8ae-0e399619a6fc', 'Bộ trụ', '[{"id":"cat","tenCongDoan":"Cắt bộ","nguoiMa":"","nguoiTen":"","donGia":2300},{"id":"in_theu","tenCongDoan":"In/Thêu","nguoiMa":"","nguoiTen":"","donGia":1500},{"id":"may_ao","tenCongDoan":"May áo","nguoiMa":"","nguoiTen":"","donGia":13000},{"id":"may_quan","tenCongDoan":"May quần","nguoiMa":"","nguoiTen":"","donGia":9500},{"id":"khuy_nut","tenCongDoan":"Khuy nút","nguoiMa":"","nguoiTen":"","donGia":750},{"id":"ui","tenCongDoan":"Ủi","nguoiMa":"","nguoiTen":"","donGia":1500},{"id":"dong_goi","tenCongDoan":"Đóng gói","nguoiMa":"","nguoiTen":"","donGia":1200}]'::jsonb);

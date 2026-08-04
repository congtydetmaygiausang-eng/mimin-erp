-- TẠO 4 MẪU CÔNG ĐOẠN (Áo tròn, Áo trụ, Bộ tròn, Bộ trụ) VÀO BẢNG mau_cong_doan

DELETE FROM mau_cong_doan WHERE id IN ('MCD-AO-TRON', 'MCD-AO-TRU', 'MCD-BO-TRON', 'MCD-BO-TRU');

INSERT INTO mau_cong_doan (id, ten, gia_cong, created_at, updated_at) VALUES
(
  'MCD-AO-TRON', 
  'Áo tròn', 
  '[{"id": "cat", "donGia": 1400, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Cắt áo"}, {"id": "in_theu", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "In/Thêu"}, {"id": "may_ao", "donGia": 13000, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May áo"}, {"id": "ui", "donGia": 900, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Ủi"}, {"id": "dong_goi", "donGia": 700, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Đóng gói"}]'::jsonb,
  now(), 
  now()
),
(
  'MCD-AO-TRU', 
  'Áo trụ', 
  '[{"id": "cat", "donGia": 1400, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Cắt áo"}, {"id": "in_theu", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "In/Thêu"}, {"id": "may_ao", "donGia": 15000, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May áo"}, {"id": "khuy_nut", "donGia": 750, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Khuy nút"}, {"id": "ui", "donGia": 900, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Ủi"}, {"id": "dong_goi", "donGia": 700, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Đóng gói"}]'::jsonb,
  now(), 
  now()
),
(
  'MCD-BO-TRON', 
  'Bộ tròn', 
  '[{"id": "cat", "donGia": 2300, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Cắt bộ"}, {"id": "in_theu", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "In/Thêu"}, {"id": "may_ao", "donGia": 13000, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May áo"}, {"id": "may_quan", "donGia": 9500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May quần"}, {"id": "ui", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Ủi"}, {"id": "dong_goi", "donGia": 1200, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Đóng gói"}]'::jsonb,
  now(), 
  now()
),
(
  'MCD-BO-TRU', 
  'Bộ trụ', 
  '[{"id": "cat", "donGia": 2300, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Cắt bộ"}, {"id": "in_theu", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "In/Thêu"}, {"id": "may_ao", "donGia": 13000, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May áo"}, {"id": "may_quan", "donGia": 9500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "May quần"}, {"id": "khuy_nut", "donGia": 750, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Khuy nút"}, {"id": "ui", "donGia": 1500, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Ủi"}, {"id": "dong_goi", "donGia": 1200, "nguoiMa": "", "nguoiTen": "", "tenCongDoan": "Đóng gói"}]'::jsonb,
  now(), 
  now()
);

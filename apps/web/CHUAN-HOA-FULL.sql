-- ====================================================
-- BƯỚC 1: TẠO BẢNG DANH MỤC VẬT TƯ (MASTER DATA)
-- ====================================================

-- Xóa bảng ncc bị dư thừa
DROP TABLE IF EXISTS ncc CASCADE;

-- Tạo bảng vat_tu
CREATE TABLE IF NOT EXISTS vat_tu (
  ma_vt TEXT PRIMARY KEY,
  ten_vt TEXT NOT NULL,
  loai_vat_tu TEXT NOT NULL,
  don_vi_tinh TEXT NOT NULL,
  don_gia_mac_dinh NUMERIC DEFAULT 0,
  mau_sac TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dọn sạch nếu có rác
DELETE FROM vat_tu; 

-- ====================================================
-- BƯỚC 2: BƠM DỮ LIỆU VÀO BẢNG vat_tu
-- ====================================================
INSERT INTO vat_tu (ma_vt, ten_vt, loai_vat_tu, don_vi_tinh, don_gia_mac_dinh, mau_sac, ghi_chu) VALUES
('V-XAMCHI035', 'XÁM CHÌ 035', 'vai', 'kg', 70000, 'Xám chì', 'Vải chính'),
('V-XANHDENCM', 'XANH ĐEN CM', 'vai', 'kg', 91000, 'Xanh đen', 'Vải chính'),
('V-MAU11', 'MÀU 11', 'vai', 'kg', 71000, 'Màu 11', 'Vải chính'),
('V-XAM6', 'XÁM 6 ( 005)', 'vai', 'kg', 67500, 'Xám', 'Vải chính'),
('V-BO068', 'BÒ (068) 26', 'vai', 'kg', 71000, 'Bò', 'Vải chính'),
('V-XAMMON109', 'XÁM MÔN 109', 'vai', 'kg', 0, 'Xám môn', 'Vải chính'),
('V-DAUXANH114', 'ĐẬU XANH 114', 'vai', 'kg', 0, 'Đậu xanh', 'Vải chính'),
('V-DO112', 'ĐỎ 112', 'vai', 'kg', 0, 'Đỏ', 'Vải chính'),
('V-XAMXANH111', 'XÁM XANH 111', 'vai', 'kg', 0, 'Xám xanh', 'Vải chính'),
('V-TRANG003', 'TRẮNG 003(1)', 'vai', 'kg', 64000, 'Trắng', 'Vải chính'),
('V-COUA044', 'CỔ UẢ 044', 'vai', 'kg', 67000, 'Cổ uả', 'Vải chính'),
('V-XANHNGOC', 'XANH NGỌC', 'vai', 'kg', 0, 'Xanh ngọc', 'Vải chính'),
('V-XANHBICH', 'VẢI XANH BÍCH', 'vai', 'kg', 91000, 'Xanh bích', 'Vải chính'),
('V-XAMLO061', 'XÁM LỢT 061', 'vai', 'kg', 71000, 'Xám lợt', 'Vải chính'),
('V-KEM3', 'KEM 3', 'vai', 'kg', 64000, 'Kem', 'Vải chính'),
('V-CACAO21', 'CACAO 21', 'vai', 'kg', 71000, 'Cacao', 'Vải chính'),
('V-XAMCHI066', 'XÁM CHÌ 066 ( 20 )', 'vai', 'kg', 70000, 'Xám chì', 'Vải chính'),
('V-DAXANH', 'ĐÁ XANH', 'vai', 'kg', 71000, 'Đá xanh', 'Vải chính'),
('V-XAMTRANG2', 'XÁM TRẮNG 2', 'vai', 'kg', 64000, 'Xám trắng', 'Vải chính'),
('V-XANHDENTH', 'XANH ĐEN THƯỜNG', 'vai', 'kg', 69000, 'Xanh đen', 'Vải chính'),
('V-VANG14', 'VÀNG 14', 'vai', 'kg', 71000, 'Vàng', 'Vải chính'),
('V-XAMCHI035N', 'Poly Nano Xám 035', 'vai', 'kg', 70000, 'Xám', 'Vải chính'),
('V-DENNANO', 'Poly Nano Đen', 'vai', 'kg', 91000, 'Đen', 'Vải chính'),
('V-XAMNANO', 'Poly Nano Xám', 'vai', 'kg', 71000, 'Xám', 'Vải chính'),
('V-REUNANO', 'Poly Nano Rêu', 'vai', 'kg', 71000, 'Rêu', 'Vải chính'),
('V-2DADEN', 'VẢI 2DA ĐEN', 'vai', 'kg', 69000, 'Đen', 'Vải chính'),
('V-2DAREU', 'VẢI 2DA RÊU', 'vai', 'kg', 71000, 'Rêu', 'Vải chính'),
('V-2DANAU', 'VẢI 2DA NÂU ĐẤT', 'vai', 'kg', 71000, 'Nâu đất', 'Vải chính'),
('V-2DAXAMCHI', 'VẢI 2DA XÁM CHÌ', 'vai', 'kg', 71000, 'Xám chì', 'Vải chính'),
('V-COTTON100-TRANG', 'VẢI COTTON 100% TRẮNG', 'vai', 'kg', 85000, 'Trắng', 'Vải mới thêm'),
('V-CASAUDEN', 'VẢI CÁ SẤU ĐEN', 'vai', 'kg', 95000, 'Đen', 'Vải mới thêm'),
('BO-001', 'Bo Cổ Trơn - TRẮNG 003(1)', 'phu-lieu', 'bộ', 6000, 'TRẮNG 003', NULL),
('BO-002', 'Bo Cổ Trơn - KEM', 'phu-lieu', 'bộ', 6000, 'KEM', NULL),
('BO-003', 'Bo Cổ Trơn - KEM 108', 'phu-lieu', 'bộ', 6000, 'KEM 108', NULL),
('BO-004', 'Bo Cổ Trơn - GỪNG 040', 'phu-lieu', 'bộ', 6000, 'GỪNG 040', NULL),
('BO-005', 'Bo Cổ Trơn - BEIGE 5V7036', 'phu-lieu', 'bộ', 6000, 'BEIGE 5V7036', NULL),
('BO-006', 'Bo Cổ Trơn - XÁM 005', 'phu-lieu', 'bộ', 6000, 'XÁM 005', NULL),
('BO-007', 'Bo Cổ Trơn - CỔ UẢ 044', 'phu-lieu', 'bộ', 6000, 'CỔ UẢ 044', NULL),
('BO-008', 'Bo Cổ Trơn - XÁM XANH 90', 'phu-lieu', 'bộ', 6000, 'XÁM XANH 90', NULL),
('BO-009', 'Bo Cổ Trơn - RÊU 036', 'phu-lieu', 'bộ', 6000, 'RÊU 036', NULL),
('BO-010', 'Bo Cổ Trơn - XÁM CHÌ 035', 'phu-lieu', 'bộ', 6000, 'XÁM CHÌ 035', NULL),
('BO-011', 'Bo Cổ Trơn - CỔ VỊT 012', 'phu-lieu', 'bộ', 6000, 'CỔ VỊT 012', NULL),
('BO-012', 'Bo Cổ Trơn - ĐEN', 'phu-lieu', 'bộ', 6000, 'ĐEN', NULL),
('BO-013', 'Bo Cổ Trơn - XÁM LỢT 061', 'phu-lieu', 'bộ', 6000, 'XÁM LỢT 061', NULL),
('BO-014', 'Bo Cổ Trơn - XÁM 81', 'phu-lieu', 'bộ', 6000, 'XÁM 81', NULL),
('BO-015', 'Bo Cổ Trơn - CỔ VỊT 11', 'phu-lieu', 'bộ', 6000, 'CỔ VỊT 11', NULL),
('BO-016', 'Bo Cổ Trơn - XÁM 066', 'phu-lieu', 'bộ', 6000, 'XÁM 066', NULL),
('BO-017', 'Bo Cổ Trơn - XANH NHỚT 069', 'phu-lieu', 'bộ', 6000, 'XANH NHỚT 069', NULL),
('BO-018', 'Bo Cổ Trơn - CA CAO 21', 'phu-lieu', 'bộ', 6000, 'CA CAO 21', NULL),
('BO-019', 'Bo Cổ Trơn - XÁM MÔN', 'phu-lieu', 'bộ', 6000, 'XÁM MÔN', NULL),
('BO-020', 'Bo Cổ Trơn - ĐỎ', 'phu-lieu', 'bộ', 6000, 'ĐỎ', NULL),
('BO-021', 'Bo Cổ Trơn - XANH ĐEN', 'phu-lieu', 'bộ', 6000, 'XANH ĐEN', NULL),
('BO-022', 'Bo Cổ Trơn - BÒ 068', 'phu-lieu', 'bộ', 6000, 'BÒ 068', NULL),
('BO-023', 'Bo Cổ 2 da trắng sọc xanh đen tay trắng', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-024', 'Bo Cổ 2 da trắng sọc xanh đen tay đen', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-025', 'Bo Cổ 2 da trắng sọc đen+gừng tay đen', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-026', 'Bo Cổ 2 da trắng sọc đen+gừng tay trắng', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-027', 'Bo Cổ 2 da trắng sọc đen+gừng tay kem', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-028', 'Bo Cổ 2 da gừng sọc đen tay gừng', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-029', 'Bo Cổ 2 da trắng sọc đen tay đen', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-030', 'Bo Cổ 2 da đen sọc trắng', 'phu-lieu', 'bộ', 7200, '(Nhiều màu)', NULL),
('BO-031', 'Bo trắng sọc đỏ', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-032', 'Bo trắng sọc đỏ+xanh', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-033', 'Bo đỏ +2 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-034', 'Bo xám chì 035 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-035', 'Bo đen 2 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-036', 'Bo xanh đen sọc trắng đỏ', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-037', 'Bo đỏ 2 sọc trắng xanh lá', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-038', 'Bo 1 sọc xám 005 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-039', 'Bo 1 sọc xám 035 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-040', 'Bo 1 sọc xanh nhớt 069 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-041', 'Bo 2 sọc nhí rêu 036 sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-042', 'Bo 2 sọc nhí đen sọc gừng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-043', 'Bo 1 sọc nhí ca cao sọc bò 068', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-044', 'Bo 1 sọc nhí xanh đen sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-045', 'Bo 1 sọc nhí cỏ úa sọc trắng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-046', 'Bo 1 sọc nhí gừng sọc đen', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BO-047', 'Bo 1 sọc nhí đen sọc gừng', 'phu-lieu', 'bộ', 6000, '(Nhiều màu)', NULL),
('BAOBI_GIAY', 'Bao bì + Giấy', 'phu-lieu', 'sp', 700, NULL, 'Chi phí cố định'),
('THEBAI', 'Thẻ bài', 'phu-lieu', 'sp', 700, NULL, 'Chi phí cố định'),
('DAYKEO', 'Dây kéo', 'phu-lieu', 'sp', 1400, NULL, 'Chi phí cố định'),
('THUNQUAN', 'Thun quần', 'phu-lieu', 'sp', 1500, NULL, 'Chi phí cố định');


-- ====================================================
-- BƯỚC 3: CHUẨN HÓA BẢNG GIAO DỊCH KHO
-- ====================================================

-- 3.1 Chuyển đổi cột 'ngay' sang TIMESTAMPTZ
ALTER TABLE giao_dich_kho 
  ALTER COLUMN ngay TYPE TIMESTAMPTZ 
  USING ngay::TIMESTAMPTZ;

-- 3.2 Thêm Khóa Ngoại (Foreign Key) để đảm bảo toàn vẹn dữ liệu
-- Từ nay về sau, các giao dịch kho BẮT BUỘC phải dùng mã vật tư có trong bảng vat_tu
ALTER TABLE giao_dich_kho 
  ADD CONSTRAINT fk_giao_dich_kho_vat_tu 
  FOREIGN KEY (ma_vt) 
  REFERENCES vat_tu(ma_vt) 
  ON DELETE CASCADE;

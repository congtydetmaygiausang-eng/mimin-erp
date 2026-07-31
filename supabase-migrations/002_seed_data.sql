-- ============================================
-- MIMIN ERP - Seed Data (sau khi đã chạy 001)
-- ============================================

-- Clear existing data
TRUNCATE users CASCADE;
TRUNCATE tasks CASCADE;
TRUNCATE kho CASCADE;
TRUNCATE cong_no CASCADE;
TRUNCATE nha_cung_cap CASCADE;
TRUNCATE khach_hang_si CASCADE;
TRUNCATE xuong_gia_cong CASCADE;
TRUNCATE lenh_sx_tong CASCADE;

-- ============================================
-- 19 USER NỘI BỘ (bảng chốt a Cường 2026-07-29)
-- Password hash SHA-256 với salt "polomimin-mimin-erp-v89"
-- ============================================
-- Helper: hash của "123" = "1a598a77881c0f6475450d93e0f9b7314a955141391ffaa652ab1629214c6b79"
-- Helper: hash của "sang123" = "ecef8ef59433b30757a75cce63bf4feecb3cdbef9df001d85ff9d66770d011a8"

INSERT INTO users (username, email, name, nhom, phong_ban, ma_nv, chuc_vu, sdt, password_hash, role) VALUES
-- 6 nhóm quản lý
('sang',   'sang@mimin.vn',   'Anh Sang (Admin)',         'quan-tri',   'ban-giam-doc', 'NV035', 'Quản trị hệ thống',           '0901234500', 'ecef8ef59433b30757a75cce63bf4feecb3cdbef9df001d85ff9d66770d011a8', 'admin'),
('giau',   'giau@mimin.vn',   'Chị Giàu',                 'dieu-hanh',  'ban-giam-doc', 'NV001', 'Giám đốc điều hành',           '0901234567', '4951c7f3aa78714e63af8640b5086097f82a3c22a750a42533eccd85584412cb', 'admin'),
('thanh',  'thanh@mimin.vn',  'Bùi Thị Thanh',            'ke-toan',    'ke-toan',      'NV002', 'Kế toán trưởng + Điều phối SX','0912345678', 'adb10859ce565fa2b67d104d19ba826a43c4154f48746f96ad4e74fada318666', 'manager'),
('huyen',  'huyen@mimin.vn',  'Đỗ Thị Huyền',             'ban-si',     'kinh-doanh',   'NV003', 'Trưởng phòng KH sỉ',           '0933456789', 'e2c0419c4f6e70fefcd4ab9404eaa9e9132e8f313401d2d0b7b4e1692ebaa17e', 'manager'),
('vy',     'vy@mimin.vn',     'Cẩm Vy',                   'content',    'marketing',    'NV004', 'Trưởng nhóm Content - Media', '0944567890', '7d8ead538a924ee16181c2e465494ba94bff800cfa4a99ac7b12157c83cbd5d6', 'manager'),
('hau',    'hau@mimin.vn',    'Quốc Hậu',                 'kho',        'kho-soi',      'NV005', 'Thủ kho trưởng',                '0955678901', '37e0b769b63bcafda158b9a7439bd211af2b425b077f59cb2dac846d93033484', 'manager'),
-- 3 nhóm Cắt
('giang',  'giang@mimin.vn',  'Giang (Cắt)',              'cat',        'to-may',       'NV006', 'Tổ trưởng Cắt',                '0966789012', '2e867228954e77cfacb435fe57e4b488a8657d706846627638ee2e280670a6a2', 'worker'),
('de',     'de@mimin.vn',     'Đệ (Cắt)',                 'cat',        'to-may',       'NV007', 'CN Cắt (1400đ trụ/1200đ tròn/900đ quần)','0977890123', 'c2dbdc9b9092d7c7a6dbc73ebecb717a5cd4c2c7919a07d58a14e1b1b204b538', 'worker'),
('phu',    'phu@mimin.vn',    'Phú (Cắt)',                'cat',        'to-may',       'NV008', 'CN Cắt hỗ trợ',                '0988901234', '91e015d45404ee072be0eb2f74cf2273e9273e235f5eb47ca3bd09caa697a279', 'worker'),
-- 2 nhóm Khuy nút
('ruong',  'ruong@mimin.vn',  'Ruộng (Khuy nút)',         'khuy-nut',   'hoan-thien',   'NV017', 'Tổ trưởng Khuy nút (750đ/cái)','0978890123', 'ea31b0eefb3576c1c554d184c1e8840206cc8793a3a6c7950fb3cee15702ae93', 'worker'),
('khoi',   'khoi@mimin.vn',   'Khôi (Khuy nút)',          'khuy-nut',   'hoan-thien',   'NV018', 'CN Khuy nút',                   '0989901234', 'fb93d5e3bcba894b814e8af8073075aeb7d947f6c924e15d264646274ce5488d', 'worker'),
-- 4 nhóm Ủi
('tuyen',  'tuyen@mimin.vn',  'Tuyền (Ủi)',               'ui',         'hoan-thien',   'NV011', 'Tổ trưởng Ủi',                  '0912234567', '9c2438b79a98de5d784ec63f13c611c0f750177755637a70e41c2c9aae92ace1', 'worker'),
('huynh',  'huynh@mimin.vn',  'Huynh (Ủi)',               'ui',         'hoan-thien',   'NV012', 'CN Ủi áo/quần',                '0923345678', '6a65958ef75e6c164d78e09b66a0071107e0e8527eb35323b7d05d6d7237aafd', 'worker'),
('thuy',   'thuy@mimin.vn',   'Thủy (Ủi)',                'ui',         'hoan-thien',   'NV013', 'CN Ủi hoàn thiện',             '0934456789', '998f0e3b916efa42f566aa48c088eb6c94c1388ac363bc28acad27a1b2801e34', 'worker'),
('anhui',  'anhui@mimin.vn',  'Anh (Ủi)',                 'ui',         'hoan-thien',   'NV014', 'CN Ủi theo lô',                '0945567890', 'db0558eaa792e934321fe78c46cab0d36e02565a0b110f9a4a673484883212f0', 'worker'),
-- 4 nhóm Đóng gói
('nhi',    'nhi@mimin.vn',    'Mỹ Nhi (Gấp xếp)',         'gap',        'hoan-thien',   'NV009', 'Tổ trưởng Gấp xếp',             '0999012345', '09edf1a79a0703cc6cf9187f05c7cd2061db6def1ec380619866d9200021b11c', 'worker'),
('phuong', 'phuong@mimin.vn', 'Phương (Gấp xếp)',         'gap',        'hoan-thien',   'NV010', 'CN Gấp - Xếp',                  '0990123456', '0782a711c55f264c1d0318f94c51766b209384df1e1e15c3afcf873b540f1688', 'worker'),
('tim',    'tim@mimin.vn',    'Tím (Gấp xếp)',            'gap',        'hoan-thien',   'NV015', 'CN Phân loại - Bao',            '0956678901', '21edb136734141a30965f66cef8e5680045688b014978ff0d73d8dde7049fc53', 'worker'),
('phien',  'phien@mimin.vn',  'Phiên (Gấp xếp)',          'gap',        'hoan-thien',   'NV016', 'CN Gấp - Tem - Đóng bao',       '0967789012', 'cb24817f8216883696ea3a7620aa93b5dc8ba3afe2a368fe3800b35f407ca7b5', 'worker'),
-- 7 mock users (legacy) - password cũ
('admin',     'admin@mimin.vn',     'Nguyễn Văn An',        'ban-giam-doc',  'ban-giam-doc', '',  'Quản trị viên',       '', '082baf62a62001b0ec7c23c91154208d60d24f0468503c335edf2053dce34f11', 'admin'),
('planner',   'planner@mimin.vn',   'Trần Thị Bình',        'ke-hoach-sx',   'ke-hoach-sx',  '',  'Chuyên viên KH',      '', 'db88dafd4b4e4d81517d9257c546beaf27de892e8bc18293a387ad3bbe799a62', 'planner'),
('warehouse', 'warehouse@mimin.vn', 'Lê Văn Cường',         'kho-soi',       'kho-soi',      '',  'Quản lý kho',         '', 'fed969f5bd5bd94929a30bca3043a6cdd02d9ce9dbf82a214705caf67d035272', 'warehouse'),
('sewing',    'sewing@mimin.vn',    'Phạm Thị Dung',        'to-may',        'to-may',       '',  'Tổ trưởng may',       '', 'a8da9950838626d776063ff63a26eaa441c57a67117257a649361edb34c941e6', 'sewing'),
('qc',        'qc@mimin.vn',        'Hoàng Minh Đức',       'qc',            'qc',           '',  'Kiểm tra CL',         '', '17c18ad4195b90f33a15fc228bce13a872c551ba83d82ed79f4c7ccd0f639948', 'qc'),
('finishing', 'finishing@mimin.vn', 'Đỗ Thị Hương',         'hoan-thien',    'hoan-thien',   '',  'Tổ trưởng HT',        '', '8cae766be0805fe0cb3ab6f86799570bd94245aaf39ee7570d910a6e8c686bf5', 'finishing'),
('accountant','accountant@mimin.vn','Bùi Văn Hùng',         'ke-toan',       'ke-toan',      '',  'Kế toán',             '', 'f70d4b20c5ba07920a9ffbe6b096533dfef0f1057813553645e36ccfcd2a0470', 'accountant')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 16 TASKS (6 LSX thật theo Lark chị Giàu)
-- ============================================
INSERT INTO tasks (id, title, sp, lsx, lsx_code, mau, size, so_luong_giao, so_luong_nhan, so_luong_dat, so_luong_loi, status, nhom, assigned_to, giao_boi, deadline, ngay_giao, ngay_hoan_thanh, don_gia, thanh_tien, con_no, trang_thai, ghi_chu) VALUES
-- M758 - Bộ trụ trơn 500 bộ
('CAT_001',  'Cắt bộ trụ trơn 500 bộ',  'Bộ trụ trơn',  'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 500, 498, 2, 'hoan-thanh', 'cat',      'giang',  'thanh', '2026-07-22', '2026-07-20', '2026-07-22', 1400,  697200,   697200,  'Hoàn thành', 'Cắt áo trụ 1.400đ × 498 = 697.200đ. Lỗi 2 bộ (dập lệch – sửa lại)'),
('INTD_001', 'In logo + dập chữ 500 bộ', 'Bộ trụ trơn',  'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 500, 498, 2, 'hoan-thanh', 'intd',     'DT-IN-002','giau', '2026-07-25', '2026-07-22', '2026-07-25', 0,     0,         0,        'Hoàn thành', 'Outsource in/dập. Lỗi 2 cái dập lệch → Bảo Ngân sửa miễn phí'),
('MAY_001',  'May áo trụ 500 áo',        'Áo trụ',       'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 0,   0,   0, 'dang-lam',   'may',      'DT-MAY-011','thanh','2026-08-05', '2026-07-26', NULL,         4500,  0,         0,        'Đang may',    'Outsource may áo trụ. Đơn giá 4.500đ'),
('KN_001',   'Đính nút 500 cái',         'Bộ trụ trơn',  'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 250, 200, 50,'dang-lam',   'khuy-nut', 'ruong',  'thanh', '2026-08-08', '2026-07-28', NULL,         750,   150000,    150000,  'Đang làm',    'Đính nút 750đ × 200 = 150K. Đang làm'),
('UI_001',   'Ủi bộ trụ 100 sp',         'Bộ trụ trơn',  'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 100, 100, 0, 'dang-lam',   'ui',       'tuyen',  'thanh', '2026-08-10', '2026-07-30', NULL,         2000,  200000,    200000,  'Đang làm',    'Ủi 2.000đ × 100 = 200K'),
('DG_001',   'Gấp xếp - đóng gói 0 sp',  'Bộ trụ trơn',  'M758', 'LSX-2026-001', 'Trắng ngà', 'L, XL, 2XL', 500, 0,   0,   0, 'chua-lam',   'gap',      'nhi',    'thanh', '2026-08-12', NULL,         NULL,         800,   0,         0,        'Chờ gấp',     'Gấp xếp 800đ/sp'),
-- M873 - Áo thun cotton 1500 áo
('CAT_002',  'Cắt áo thun cotton 1500 áo', 'Áo thun cotton', 'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 1500, 1495, 5, 'hoan-thanh', 'cat',     'giang',  'thanh', '2026-07-30', '2026-07-25', '2026-07-30', 1200, 1794000, 1794000, 'Hoàn thành', 'Cắt áo tròn 1.200đ × 1495 = 1.794.000đ. Lỗi 5 áo (vải bẩn)'),
('INTD_002', 'In logo 1500 áo',             'Áo thun cotton', 'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 1500, 1495, 5, 'hoan-thanh', 'intd',    'DT-IN-001','giau', '2026-08-02', '2026-07-30', '2026-08-02', 5000,  7475000, 7475000, 'Hoàn thành', 'In thân + tay 5.000đ × 1495 = 7.475.000đ'),
('MAY_002',  'May áo thun 1500 áo',         'Áo thun',       'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 0,    0,    0, 'dang-lam',   'may',     'DT-MAY-001','thanh','2026-08-10', '2026-08-03', NULL,         14000, 0,        0,       'Đang may',    'May áo thun 14.000đ/áo'),
('KN_002',   'Đính nút áo thun 1500 nút',  'Áo thun cotton', 'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 500,  0,    0, 'dang-lam',   'khuy-nut','ruong',  'thanh', '2026-08-08', '2026-08-05', NULL,         750,   0,        0,       'Chờ giao',    'Đang chờ giao từ tổ may'),
('UI_002',   'Ủi áo thun 0 sp',             'Áo thun cotton', 'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 0,    0,    0, 'chua-lam',   'ui',      'tuyen',  'thanh', '2026-08-12', NULL,         NULL,         2000,  0,        0,       'Chờ',         'Ủi 2.000đ/sp'),
('DG_002',   'Gấp xếp áo thun 0 sp',        'Áo thun',       'M873', 'LSX-2026-002', 'Đen',     'M, L, XL, XXL', 1500, 0,    0,    0, 'chua-lam',   'gap',     'phuong', 'thanh', '2026-08-15', NULL,         NULL,         800,   0,        0,       'Chờ gấp',     'Gấp áo thường 800đ'),
-- M111 - Áo polo trắng 800 áo
('CAT_003',  'Cắt áo polo 800 áo',         'Áo polo',       'M111', 'LSX-2026-003', 'Trắng',   'M, L, XL',     800, 800, 795, 5, 'hoan-thanh', 'cat',     'phu',    'thanh', '2026-07-21', '2026-07-18', '2026-07-21', 1200,  954000,  954000,  'Hoàn thành', 'Cắt áo polo cổ bẻ. 1.200đ × 795 = 954K. Lỗi 5 áo (vải bẩn)'),
-- M222, M333, M555: thêm sau
('CAT_004',  'Cắt bộ thể thao 600 bộ',     'Bộ thể thao',   'M222', 'LSX-2026-004', 'Đen, Xám','L, XL, XXL',   600, 600, 590, 10,'hoan-thanh', 'cat',     'giang',  'thanh', '2026-07-29', '2026-07-22', '2026-07-29', 1400,  826000,  826000,  'Hoàn thành', 'Bộ thể thao nam 1.400đ/bộ'),
('CAT_005',  'Cắt áo sơ mi nữ 600 áo',     'Áo sơ mi nữ',   'M333', 'LSX-2026-005', 'Trắng',   'S, M, L',      600, 600, 595, 5, 'hoan-thanh', 'cat',     'de',     'thanh', '2026-07-29', '2026-07-24', '2026-07-29', 1200,  714000,  714000,  'Hoàn thành', 'Áo sơ mi nữ cổ bẻ 1.200đ/áo'),
('CAT_006',  'Cắt quần kaki nam 700 quần', 'Quần kaki nam', 'M555', 'LSX-2026-006', 'Nâu, Đen','29, 30, 31, 32',700, 700, 695, 5, 'hoan-thanh', 'cat',     'phu',    'thanh', '2026-07-29', '2026-07-25', '2026-07-29', 900,   625500,  625500,  'Hoàn thành', 'Quần kaki 900đ/quần')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5 SKU KHO
-- ============================================
INSERT INTO kho (sku, ten, sl, don_vi, ton_thap, ngay_nhap, loai) VALUES
('VAI-COTTON-TRANG', 'Vải cotton trắng',     1200, 'm',     500,  '2026-07-25', 'vai'),
('VAI-POLO-XANH',    'Vải polo xanh navy',     350, 'm',     500,  '2026-07-20', 'vai'),
('NUT-15MM',         'Nút 15mm đen',            850, 'cái',   1000, '2026-07-22', 'phu-lieu'),
('CHI-POLY',         'Chỉ polyester',           45, 'cuộn',   20,  '2026-07-15', 'phu-lieu'),
('TUI-PVC',          'Túi PVC đóng gói',      2500, 'cái',   500,  '2026-07-28', 'phu-lieu')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- 4 CÔNG NỢ KHÁCH HÀNG
-- ============================================
INSERT INTO cong_no (id, kh, no, han, status) VALUES
('CN001', 'Shop Mẹ Bé Xinh',     45000000, '2026-08-15', 'chua-thu'),
('CN002', 'Đại lý Thanh Hà',     12300000, '2026-08-05', 'chua-thu'),
('CN003', 'Shop Áo Thun Sỉ HN',   8900000, '2026-08-20', 'da-thu-1-phan'),
('CN004', 'Đại lý Miền Tây',     23400000, '2026-08-10', 'chua-thu')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 16 NHÀ CUNG CẤP (Master Data)
-- ============================================
INSERT INTO nha_cung_cap (ma_ncc, ten_ncc, loai, dia_chi, sdt, email, mst, nguoi_lh, cong_no, ghi_chu, trang_thai) VALUES
('NCC-01', 'Công ty Lucky Avanti', 'sợi', 'KCN Tân Bình, TP.HCM', '028-3812-3456', 'luckyavanti@gmail.com', '0312445678', 'Anh Tuấn', 0, 'Sợi cotton 30s/32s/40s, giao 3-5 ngày', 'Đang hợp tác'),
('NCC-02', 'CT TNHH TM Quốc tế Sammoon', 'sợi', 'Q.Bình Thạnh, TP.HCM', '028-3899-1122', 'sammoon@hcm.vn', '0305678901', 'Chị Hạnh', 909052000, 'Sợi 30s, đơn giá 42.000đ/kg', 'Đang hợp tác'),
('NCC-03', 'CT TNHH SX TM Dệt May Hải Dương', 'dệt', 'Hải Dương', '0220-3555-888', 'haiduong@dvm.vn', '0801234567', 'Anh Hải', 183944000, 'Dệt thoi 30s/32s, giao 7 ngày, 10.000đ/kg', 'Đang hợp tác'),
('NCC-04', 'CT TNHH MTV Dệt Nhuộm Thái Thành', 'nhuộm', 'Bình Dương', '0274-3777-111', 'thaithanh@bd.vn', '3701234567', 'Anh Hùng', 0, 'Nhuộm màu theo yêu cầu, 5-7 ngày', 'Đang hợp tác'),
('NCC-05', 'CT CP Dệt Nhuộm Phú Long', 'bo cổ', 'Q.Tân Phú, TP.HCM', '028-3556-7890', 'phulong@vnn.vn', '0307890123', 'Chị Lan', 184369120, 'Bo cổ 2 da + bo tay, 4.500đ - 6.500đ/cái', 'Đang hợp tác'),
('NCC-06', 'Hộ kinh doanh Vũ Văn Hiệp', 'bo cổ', 'Q.Gò Vấp, TP.HCM', '0903-456-789', 'hiepvu@gmail.com', '', 'Vũ Văn Hiệp', 74315000, 'Bo cổ trơn các loại', 'Đang hợp tác'),
('NCC-07', 'CT TNHH Phụ liệu May mặc Tường Vy', 'phụ liệu', 'Q.5, TP.HCM', '028-3834-5566', 'tuongvy@plm.vn', '0311223344', 'Anh Tuấn', 10200000, 'Thun, giấy gấp xếp, bao bì', 'Đang hợp tác'),
('NCC-08', 'CT TNHH TM Dịch vụ Hằng Lữ', 'phụ liệu', 'Q.11, TP.HCM', '028-3962-3344', 'hanglu@vnn.vn', '0309988776', 'Chị Lữ', 91500000, 'Dây kéo các loại, 250đ - 1.500đ/cái', 'Đang hợp tác'),
('NCC-11', 'CT TNHH SX TM Nhãn mác Hải Nam', 'nhãn', 'Q.Tân Bình, TP.HCM', '028-3847-2211', 'hainam@label.vn', '0314455667', 'Anh Nam', 0, 'Nhãn thẻ bài, 350đ/cái', 'Đang hợp tác'),
('NCC-12', 'CT TNHH In ấn Thông Anh', 'in ấn', 'Q.Gò Vấp, TP.HCM', '028-3987-5544', 'thonganh@print.vn', '0312233445', 'Chị Thông', 21047904, 'Nhãn size, 180đ/cái', 'Đang hợp tác'),
('NCC-13', 'CT TNHH SX KDTM Bao bì Đại Hoàng Phúc', 'túi', 'Q.Bình Tân, TP.HCM', '028-3762-8899', 'daihoangphuc@bb.vn', '0306677885', 'Anh Phúc', 0, 'Túi zip, 120đ - 250đ/cái', 'Đang hợp tác'),
('NCC-14', 'CT TNHH Dệt Bo Hải Âu', 'bo cổ', 'Long An', '0272-3556-789', 'haiau@la.vn', '1100123456', 'Chị Hải', 31795000, 'Bo cổ trơn + 2 da, 3.500đ - 5.500đ/cái', 'Đang hợp tác'),
('NCC-15', 'CT TNHH Bao Bì Phúc Vinh', 'túi', 'Q.12, TP.HCM', '028-3715-9988', 'phucvinh@bb.vn', '0305544332', 'Anh Vinh', 3450000, 'Bao bì PE, thùng carton', 'Đang hợp tác'),
('NCC-16', 'Cty TNHH SX Cúc nút Kim Long', 'phụ liệu', 'Q.Bình Thạnh, TP.HCM', '028-3899-7766', 'kimlong@cuc.vn', '0310099887', 'Anh Long', 0, 'Cúc 15mm, cúc 12mm, nút bấm đủ loại, 750đ/cái', 'Đang hợp tác')
ON CONFLICT (ma_ncc) DO NOTHING;

-- ============================================
-- 12 KHÁCH HÀNG SỈ (Master Data)
-- ============================================
INSERT INTO khach_hang_si (ma_kh, ten_kh, loai, dia_chi, sdt, email, mst, nguoi_lh, chinh_sach, han_muc_no, cong_no_hien_tai, doanh_so_nam, sp_chinh, trang_thai) VALUES
('KH-01', 'Shop Mẹ Bé Xinh', 'Shop online', 'Q.1, TP.HCM', '0901-234-567', 'mebexinh@gmail.com', '', 'Chị Linh', 'Công nợ 30 ngày', 50000000, 45000000, 800000000, 'Bộ trụ trơn, áo polo', 'VIP'),
('KH-02', 'Đại lý Thanh Hà', 'Đại lý', 'Hoàn Kiếm, Hà Nội', '024-3925-6677', 'thanhha@hanoi.vn', '0101234567', 'Anh Hà', 'Công nợ 15 ngày', 20000000, 12300000, 350000000, 'Áo thun cotton', 'Thường'),
('KH-03', 'Shop Áo Thun Sỉ Hà Nội', 'Shop online', 'Q.Cầu Giấy, Hà Nội', '0987-654-321', 'aothunsihn@gmail.com', '', 'Chị Hương', 'Công nợ 30 ngày', 15000000, 8900000, 280000000, 'Áo thun, áo polo', 'Mới'),
('KH-04', 'Đại lý Miền Tây', 'Đại lý', 'Cần Thơ', '0292-3812-345', 'mientay@cantho.vn', '1801234567', 'Anh Tây', 'Công nợ 30 ngày', 30000000, 23400000, 520000000, 'Bộ thể thao, quần kaki', 'Thường'),
('KH-05', 'Chuỗi 5S Fashion (10 cửa hàng)', 'Chuỗi cửa hàng', 'Q.1, TP.HCM + các tỉnh', '028-3522-9988', '5sfashion@chain.vn', '0315678901', 'Chị Trang', 'Công nợ 60 ngày', 100000000, 67500000, 1500000000, 'Bộ trụ, áo polo, áo sơ mi', 'VIP'),
('KH-06', 'Cửa hàng 168 (Bình Dương)', 'Cửa hàng', 'Thủ Dầu Một, Bình Dương', '0274-3812-456', '168bd@gmail.com', '3702345678', 'Anh Lộc', 'Thanh toán trước', 0, 0, 180000000, 'Áo thun cotton', 'Thường'),
('KH-07', 'Shop Thời trang Minh Tâm', 'Shop online', 'Q.Bình Thạnh, TP.HCM', '0938-456-789', 'minhtam.fashion@gmail.com', '', 'Chị Tâm', 'Công nợ 15 ngày', 10000000, 4200000, 150000000, 'Áo sơ mi nữ, áo thun', 'Thường'),
('KH-08', 'Đại lý Bắc Ninh (Anh Đức)', 'Đại lý', 'Bắc Ninh', '0222-3567-123', 'ducbn@bacninh.vn', '2301234567', 'Anh Đức', 'Công nợ 30 ngày', 25000000, 15600000, 420000000, 'Bộ thể thao, quần kaki', 'Thường'),
('KH-09', 'Shop Online Shopee + TikTok Shop', 'Shop online', 'Q.7, TP.HCM', '0908-112-233', 'shoponlineshopee@gmail.com', '', 'Anh Khoa', 'Thanh toán trước', 0, 0, 220000000, 'Áo thun, áo polo', 'Mới'),
('KH-10', 'Đại lý Đà Nẵng (Chị Hạnh)', 'Đại lý', 'Q.Hải Châu, Đà Nẵng', '0236-3812-999', 'hanhdn@danang.vn', '0401234567', 'Chị Hạnh', 'Công nợ 30 ngày', 20000000, 11800000, 320000000, 'Áo polo, áo sơ mi', 'Thường'),
('KH-11', 'Cty CP XNK Việt Thái (Xuất khẩu)', 'Xuất khẩu', 'Q.Tân Bình, TP.HCM', '028-3947-1122', 'vietthai@xkn.vn', '0319988776', 'Anh Thái', 'Thanh toán trước', 0, 0, 800000000, 'Áo thun xuất khẩu', 'VIP'),
('KH-12', 'Shop Trẻ Thơ Baby', 'Shop online', 'Q.Gò Vấp, TP.HCM', '0912-778-899', 'trethobaby@gmail.com', '', 'Chị Thư', 'Công nợ 15 ngày', 8000000, 3200000, 95000000, 'Bộ trẻ em, áo thun', 'Mới')
ON CONFLICT (ma_kh) DO NOTHING;

-- ============================================
-- 5 XƯỞNG GIA CÔNG (Master Data)
-- ============================================
INSERT INTO xuong_gia_cong (ma_xuong, ten_xuong, loai, dia_chi, sdt, email, nguoi_lh, cong_suat, don_gia_tb, don_vi, ghi_chu, trang_thai) VALUES
('XG-01', 'Xưởng may Minh Phát (Bình Dương)', 'May áo', 'Dĩ An, Bình Dương', '0274-3777-555', 'minhphat@xm.vn', 'Anh Phát', '800-1,000 áo/ngày', 14000, 'đ/áo', 'Chuyên áo trụ, áo polo, uy tín 5 năm', 'Đang hợp tác'),
('XG-02', 'Xưởng may Hoàng Gia (Long An)', 'May quần', 'Bến Lức, Long An', '0272-3556-444', 'hoanggia@xm.vn', 'Chị Hoa', '600-800 quần/ngày', 18000, 'đ/quần', 'Chuyên quần kaki, quần thể thao', 'Đang hợp tác'),
('XG-03', 'Xưởng in Bảo Ngân (TP.HCM)', 'In/Thêu/Dập', 'Q.12, TP.HCM', '028-3715-1111', 'baongan@in.vn', 'Anh Bảo', '2,000-3,000 sp/ngày', 2500, 'đ/sp', 'In lụa, dập nhiệt, thêu vi tính, giao 3-5 ngày', 'Đang hợp tác'),
('XG-04', 'Xưởng thêu Hoàng Anh (Bình Dương)', 'In/Thêu/Dập', 'Thuận An, Bình Dương', '0274-3777-666', 'hoanganh@theu.vn', 'Chị Hoàng', '1,500 sp/ngày', 4500, 'đ/sp', 'Thêu logo, thêu vi tính, độ chính xác cao', 'Đang hợp tác'),
('XG-05', 'Xưởng may Trung Thành (Bình Dương)', 'May bộ', 'Tân Uyên, Bình Dương', '0274-3658-999', 'trungthanh@xm.vn', 'Anh Thành', '500 bộ/ngày', 22000, 'đ/bộ', 'Chuyên bộ trụ, bộ thể thao, có cắt may đầy đủ', 'Đang hợp tác')
ON CONFLICT (ma_xuong) DO NOTHING;

-- ============================================
-- VERIFY
-- ============================================
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'kho', COUNT(*) FROM kho
UNION ALL SELECT 'cong_no', COUNT(*) FROM cong_no
UNION ALL SELECT 'nha_cung_cap', COUNT(*) FROM nha_cung_cap
UNION ALL SELECT 'khach_hang_si', COUNT(*) FROM khach_hang_si
UNION ALL SELECT 'xuong_gia_cong', COUNT(*) FROM xuong_gia_cong;

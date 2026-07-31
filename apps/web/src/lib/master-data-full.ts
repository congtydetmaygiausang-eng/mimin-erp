/**
 * Master Data ĐẦY ĐỦ cho MIMIN ERP
 * Gồm: NCC vải, NCC phụ liệu, KH sỉ, Xưởng gia công
 * 
 * Data thật theo file Excel a Cường + bổ sung cho vận hành
 * Cập nhật: 2026-07-29
 */

// ============ 16 NHÀ CUNG CẤP THẬT (từ real-data.ts) ============
export interface NCC {
  id: string;
  maNCC: string;
  tenNCC: string;
  loai: "sợi" | "vải" | "phụ liệu" | "hóa chất" | "bo cổ" | "nhuộm" | "dệt" | "in ấn" | "túi" | "nhãn";
  diaChi: string;
  sdt: string;
  email: string;
  mst: string;        // Mã số thuế
  nguoiLH: string;    // Người liên hệ
  congNo: number;     // Công nợ hiện tại (VND)
  hanMuc: number;     // MỚI: Hạn mức tín dụng (VND) - default 500tr
  donGia?: string;    // Đơn giá tham khảo
  ghiChu: string;
  ngayTao: string;
  trangThai: "Đang hợp tác" | "Tạm dừng" | "Ngừng hợp tác";
}

export const NCC_FULL: NCC[] = [
  { id: "NCC-01", maNCC: "NCC-01", tenNCC: "Công ty Lucky Avanti",                      loai: "sợi",      diaChi: "KCN Tân Bình, TP.HCM",         sdt: "028-3812-3456", email: "luckyavanti@gmail.com",  mst: "0312445678", nguoiLH: "Anh Tuấn",     congNo: 0,           ghiChu: "Sợi cotton 30s/32s/40s, giao 3-5 ngày",      ngayTao: "2023-03-15", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-02", maNCC: "NCC-02", tenNCC: "CT TNHH TM Quốc tế Sammoon",                 loai: "sợi",      diaChi: "Q.Bình Thạnh, TP.HCM",         sdt: "028-3899-1122", email: "sammoon@hcm.vn",         mst: "0305678901", nguoiLH: "Chị Hạnh",     congNo: 909_052_000, ghiChu: "Sợi 30s, đơn giá 42.000đ/kg",                  ngayTao: "2023-05-20", hanMuc: 1_000_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-03", maNCC: "NCC-03", tenNCC: "CT TNHH SX TM Dệt May Hải Dương",            loai: "dệt",      diaChi: "Hải Dương",                     sdt: "0220-3555-888", email: "haiduong@dvm.vn",         mst: "0801234567", nguoiLH: "Anh Hải",      congNo: 183_944_000, donGia: "10.000 đ/kg", ghiChu: "Dệt thoi 30s/32s, giao 7 ngày",              ngayTao: "2023-04-10", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-04", maNCC: "NCC-04", tenNCC: "CT TNHH MTV Dệt Nhuộm Thái Thành",           loai: "nhuộm",    diaChi: "Bình Dương",                    sdt: "0274-3777-111", email: "thaithanh@bd.vn",         mst: "3701234567", nguoiLH: "Anh Hùng",     congNo: 0,           ghiChu: "Nhuộm màu theo yêu cầu, 5-7 ngày",         ngayTao: "2023-06-01", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-05", maNCC: "NCC-05", tenNCC: "CT CP Dệt Nhuộm Phú Long",                    loai: "bo cổ",    diaChi: "Q.Tân Phú, TP.HCM",             sdt: "028-3556-7890", email: "phulong@vnn.vn",          mst: "0307890123", nguoiLH: "Chị Lan",      congNo: 184_369_120, ghiChu: "Bo cổ 2 da + bo tay, 4.500đ - 6.500đ/cái",  ngayTao: "2023-07-15", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-06", maNCC: "NCC-06", tenNCC: "Hộ kinh doanh Vũ Văn Hiệp",                  loai: "bo cổ",    diaChi: "Q.Gò Vấp, TP.HCM",              sdt: "0903-456-789",  email: "hiepvu@gmail.com",        mst: "",            nguoiLH: "Vũ Văn Hiệp",  congNo: 74_315_000,  ghiChu: "Bo cổ trơn các loại",                         ngayTao: "2023-08-20", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-07", maNCC: "NCC-07", tenNCC: "CT TNHH Phụ liệu May mặc Tường Vy",          loai: "phụ liệu", diaChi: "Q.5, TP.HCM",                    sdt: "028-3834-5566", email: "tuongvy@plm.vn",          mst: "0311223344", nguoiLH: "Anh Tuấn",     congNo: 10_200_000,  ghiChu: "Thun, giấy gấp xếp, bao bì",                 ngayTao: "2023-09-05", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-08", maNCC: "NCC-08", tenNCC: "CT TNHH TM Dịch vụ Hằng Lữ",                 loai: "phụ liệu", diaChi: "Q.11, TP.HCM",                   sdt: "028-3962-3344", email: "hanglu@vnn.vn",            mst: "0309988776", nguoiLH: "Chị Lữ",       congNo: 91_500_000,  ghiChu: "Dây kéo các loại, 250đ - 1.500đ/cái",       ngayTao: "2023-10-10", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-09", maNCC: "NCC-09", tenNCC: "Cơ sở Dây xỏ mạc (Bình Dương)",              loai: "phụ liệu", diaChi: "Thủ Dầu Một, Bình Dương",       sdt: "0912-345-678",  email: "maymac@bd.vn",             mst: "",            nguoiLH: "Anh Hùng",     congNo: 0,           ghiChu: "Dây xỏ mạc, 800đ/m",                          ngayTao: "2023-11-15", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-10", maNCC: "NCC-10", tenNCC: "Cơ sở Dây luồn quần (Bình Dương)",            loai: "phụ liệu", diaChi: "Thuận An, Bình Dương",           sdt: "0938-123-456",  email: "dayluonquan@bd.vn",        mst: "",            nguoiLH: "Chị Hà",       congNo: 0,           ghiChu: "Dây luồn quần, 600đ/m",                       ngayTao: "2024-01-05", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-11", maNCC: "NCC-11", tenNCC: "CT TNHH SX TM Nhãn mác Hải Nam",             loai: "nhãn",      diaChi: "Q.Tân Bình, TP.HCM",            sdt: "028-3847-2211", email: "hainam@label.vn",         mst: "0314455667", nguoiLH: "Anh Nam",      congNo: 0,           ghiChu: "Nhãn thẻ bài, 350đ/cái",                      ngayTao: "2024-02-10", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-12", maNCC: "NCC-12", tenNCC: "CT TNHH In ấn Thông Anh",                     loai: "in ấn",     diaChi: "Q.Gò Vấp, TP.HCM",              sdt: "028-3987-5544", email: "thonganh@print.vn",       mst: "0312233445", nguoiLH: "Chị Thông",    congNo: 21_047_904,  ghiChu: "Nhãn size, 180đ/cái",                         ngayTao: "2024-03-15", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-13", maNCC: "NCC-13", tenNCC: "CT TNHH SX KDTM Bao bì Đại Hoàng Phúc",      loai: "túi",       diaChi: "Q.Bình Tân, TP.HCM",            sdt: "028-3762-8899", email: "daihoangphuc@bb.vn",      mst: "0306677885", nguoiLH: "Anh Phúc",     congNo: 0,           ghiChu: "Túi zip, 120đ - 250đ/cái",                   ngayTao: "2024-04-20", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-14", maNCC: "NCC-14", tenNCC: "CT TNHH Dệt Bo Hải Âu",                       loai: "bo cổ",    diaChi: "Long An",                        sdt: "0272-3556-789", email: "haiau@la.vn",              mst: "1100123456", nguoiLH: "Chị Hải",      congNo: 31_795_000,  ghiChu: "Bo cổ trơn + 2 da, 3.500đ - 5.500đ/cái",    ngayTao: "2024-05-10", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
  { id: "NCC-15", maNCC: "NCC-15", tenNCC: "CT TNHH Bao Bì Phúc Vinh",                    loai: "túi",       diaChi: "Q.12, TP.HCM",                   sdt: "028-3715-9988", email: "phucvinh@bb.vn",           mst: "0305544332", nguoiLH: "Anh Vinh",     congNo: 3_450_000,   hanMuc: 300_000_000, ghiChu: "Bao bì PE, thùng carton",                      ngayTao: "2024-06-15", trangThai: "Đang hợp tác" },
  { id: "NCC-16", maNCC: "NCC-16", tenNCC: "Cty TNHH SX Cúc nút Kim Long",                loai: "phụ liệu", diaChi: "Q.Bình Thạnh, TP.HCM",         sdt: "028-3899-7766", email: "kimlong@cuc.vn",          mst: "0310099887", nguoiLH: "Anh Long",     congNo: 0,           donGia: "750đ/cái", ghiChu: "Cúc 15mm, cúc 12mm, nút bấm đủ loại",     ngayTao: "2024-07-01", hanMuc: 300_000_000, trangThai: "Đang hợp tác" },
];

// ============ 12 KHÁCH HÀNG SỈ (thật + tham khảo thị trường VN) ============
export interface KhachHangSi {
  id: string;
  maKH: string;
  tenKH: string;
  loai: "Shop online" | "Đại lý" | "Chuỗi cửa hàng" | "Cửa hàng" | "Xuất khẩu";
  diaChi: string;
  sdt: string;
  email: string;
  mst: string;
  nguoiLH: string;
  chinhSach: "Công nợ 30 ngày" | "Công nợ 15 ngày" | "Thanh toán trước" | "Công nợ 60 ngày";
  hanMucNo: number;     // Hạn mức nợ tối đa (VND)
  congNoHT: number;     // Công nợ hiện tại
  doanhSoNam: number;   // Doanh số ước tính năm (VND)
  spChinh: string;      // Sản phẩm mua chính
  ngayTao: string;
  ghiChu: string;
  trangThai: "VIP" | "Thường" | "Mới" | "Tạm dừng";
}

export const KH_SI_FULL: KhachHangSi[] = [
  { id: "KH-01", maKH: "KH-01", tenKH: "Shop Mẹ Bé Xinh",                  loai: "Shop online",   diaChi: "Q.1, TP.HCM",          sdt: "0901-234-567",  email: "mebexinh@gmail.com",      mst: "",            nguoiLH: "Chị Linh",     chinhSach: "Công nợ 30 ngày", hanMucNo: 50_000_000,  congNoHT: 45_000_000,  doanhSoNam: 800_000_000,  spChinh: "Bộ trụ trơn, áo polo",     ngayTao: "2023-02-10", ghiChu: "Top 3 KH sỉ, đặt 2 đợt/tháng", trangThai: "VIP" },
  { id: "KH-02", maKH: "KH-02", tenKH: "Đại lý Thanh Hà",                   loai: "Đại lý",        diaChi: "Hoàn Kiếm, Hà Nội",     sdt: "024-3925-6677", email: "thanhha@hanoi.vn",         mst: "0101234567", nguoiLH: "Anh Hà",       chinhSach: "Công nợ 15 ngày", hanMucNo: 20_000_000,  congNoHT: 12_300_000,  doanhSoNam: 350_000_000,  spChinh: "Áo thun cotton",            ngayTao: "2023-04-15", ghiChu: "Đặt 2-3 đợt/tháng", trangThai: "Thường" },
  { id: "KH-03", maKH: "KH-03", tenKH: "Shop Áo Thun Sỉ Hà Nội",            loai: "Shop online",   diaChi: "Q.Cầu Giấy, Hà Nội",   sdt: "0987-654-321",  email: "aothunsihn@gmail.com",     mst: "",            nguoiLH: "Chị Hương",    chinhSach: "Công nợ 30 ngày", hanMucNo: 15_000_000,  congNoHT: 8_900_000,   doanhSoNam: 280_000_000,  spChinh: "Áo thun, áo polo",          ngayTao: "2023-06-20", ghiChu: "Khách mới, tăng trưởng tốt", trangThai: "Mới" },
  { id: "KH-04", maKH: "KH-04", tenKH: "Đại lý Miền Tây",                   loai: "Đại lý",        diaChi: "Cần Thơ",                sdt: "0292-3812-345", email: "mientay@cantho.vn",       mst: "1801234567", nguoiLH: "Anh Tây",      chinhSach: "Công nợ 30 ngày", hanMucNo: 30_000_000,  congNoHT: 23_400_000,  doanhSoNam: 520_000_000,  spChinh: "Bộ thể thao, quần kaki",   ngayTao: "2023-08-05", ghiChu: "Đặt sỉ theo mùa", trangThai: "Thường" },
  { id: "KH-05", maKH: "KH-05", tenKH: "Chuỗi 5S Fashion (10 cửa hàng)",    loai: "Chuỗi cửa hàng", diaChi: "Q.1, TP.HCM + các tỉnh", sdt: "028-3522-9988", email: "5sfashion@chain.vn",     mst: "0315678901", nguoiLH: "Chị Trang",    chinhSach: "Công nợ 60 ngày", hanMucNo: 100_000_000, congNoHT: 67_500_000,  doanhSoNam: 1_500_000_000, spChinh: "Bộ trụ, áo polo, áo sơ mi", ngayTao: "2023-01-10", ghiChu: "Khách VIP, top 1 doanh số", trangThai: "VIP" },
  { id: "KH-06", maKH: "KH-06", tenKH: "Cửa hàng 168 (Bình Dương)",         loai: "Cửa hàng",      diaChi: "Thủ Dầu Một, Bình Dương", sdt: "0274-3812-456", email: "168bd@gmail.com",         mst: "3702345678", nguoiLH: "Anh Lộc",      chinhSach: "Thanh toán trước", hanMucNo: 0,            congNoHT: 0,            doanhSoNam: 180_000_000,  spChinh: "Áo thun cotton",            ngayTao: "2023-10-15", ghiChu: "Mua đứt, không nợ", trangThai: "Thường" },
  { id: "KH-07", maKH: "KH-07", tenKH: "Shop Thời trang Minh Tâm",          loai: "Shop online",   diaChi: "Q.Bình Thạnh, TP.HCM",  sdt: "0938-456-789",  email: "minhtam.fashion@gmail.com", mst: "",          nguoiLH: "Chị Tâm",      chinhSach: "Công nợ 15 ngày", hanMucNo: 10_000_000,  congNoHT: 4_200_000,   doanhSoNam: 150_000_000,  spChinh: "Áo sơ mi nữ, áo thun",     ngayTao: "2024-01-20", ghiChu: "Shop nữ, thế mạnh áo nữ", trangThai: "Thường" },
  { id: "KH-08", maKH: "KH-08", tenKH: "Đại lý Bắc Ninh (Anh Đức)",        loai: "Đại lý",        diaChi: "Bắc Ninh",               sdt: "0222-3567-123", email: "ducbn@bacninh.vn",         mst: "2301234567", nguoiLH: "Anh Đức",      chinhSach: "Công nợ 30 ngày", hanMucNo: 25_000_000,  congNoHT: 15_600_000,  doanhSoNam: 420_000_000,  spChinh: "Bộ thể thao, quần kaki",   ngayTao: "2023-11-25", ghiChu: "Đặt đều đặn mỗi tháng", trangThai: "Thường" },
  { id: "KH-09", maKH: "KH-09", tenKH: "Shop Online Shopee + TikTok Shop",  loai: "Shop online",   diaChi: "Q.7, TP.HCM",            sdt: "0908-112-233",  email: "shoponlineshopee@gmail.com", mst: "",         nguoiLH: "Anh Khoa",     chinhSach: "Thanh toán trước", hanMucNo: 0,            congNoHT: 0,            doanhSoNam: 220_000_000,  spChinh: "Áo thun, áo polo",          ngayTao: "2024-02-10", ghiChu: "Bán online, đặt nhỏ lẻ", trangThai: "Mới" },
  { id: "KH-10", maKH: "KH-10", tenKH: "Đại lý Đà Nẵng (Chị Hạnh)",         loai: "Đại lý",        diaChi: "Q.Hải Châu, Đà Nẵng",   sdt: "0236-3812-999", email: "hanhdn@danang.vn",         mst: "0401234567", nguoiLH: "Chị Hạnh",     chinhSach: "Công nợ 30 ngày", hanMucNo: 20_000_000,  congNoHT: 11_800_000,  doanhSoNam: 320_000_000,  spChinh: "Áo polo, áo sơ mi",         ngayTao: "2023-12-05", ghiChu: "Thị trường miền Trung", trangThai: "Thường" },
  { id: "KH-11", maKH: "KH-11", tenKH: "Cty CP XNK Việt Thái (Xuất khẩu)",  loai: "Xuất khẩu",     diaChi: "Q.Tân Bình, TP.HCM",     sdt: "028-3947-1122", email: "vietthai@xkn.vn",         mst: "0319988776", nguoiLH: "Anh Thái",     chinhSach: "Thanh toán trước", hanMucNo: 0,            congNoHT: 0,            doanhSoNam: 800_000_000,  spChinh: "Áo thun xuất khẩu",        ngayTao: "2023-09-20", ghiChu: "Đơn hàng container, USD", trangThai: "VIP" },
  { id: "KH-12", maKH: "KH-12", tenKH: "Shop Trẻ Thơ Baby",                 loai: "Shop online",   diaChi: "Q.Gò Vấp, TP.HCM",      sdt: "0912-778-899",  email: "trethobaby@gmail.com",     mst: "",            nguoiLH: "Chị Thư",      chinhSach: "Công nợ 15 ngày", hanMucNo: 8_000_000,   congNoHT: 3_200_000,   doanhSoNam: 95_000_000,   spChinh: "Bộ trẻ em, áo thun",        ngayTao: "2024-04-15", ghiChu: "Thế mạnh đồ trẻ em", trangThai: "Mới" },
];

// ============ 5 XƯỞNG GIA CÔNG CHÍNH ============
export interface XuongGiaCong {
  id: string;
  maXuong: string;
  tenXuong: string;
  loai: "May áo" | "May quần" | "May bộ" | "In/Thêu/Dập" | "Giặt/Nhuộm";
  diaChi: string;
  sdt: string;
  email: string;
  nguoiLH: string;
  congSuat: string;        // Công suất (sp/ngày)
  donGiaTB: number;        // Đơn giá trung bình (đ/sp)
  donVi: string;
  ghiChu: string;
  ngayTao: string;
  trangThai: "Đang hợp tác" | "Tạm dừng";
}

export const XUONG_GIA_CONG: XuongGiaCong[] = [
  { id: "XG-01", maXuong: "XG-01", tenXuong: "Xưởng may Minh Phát (Bình Dương)",    loai: "May áo",    diaChi: "Dĩ An, Bình Dương",         sdt: "0274-3777-555", email: "minhphat@xm.vn",       nguoiLH: "Anh Phát",     congSuat: "800-1,000 áo/ngày", donGiaTB: 14000, donVi: "đ/áo",   ghiChu: "Chuyên áo trụ, áo polo, uy tín 5 năm",   ngayTao: "2023-04-10", trangThai: "Đang hợp tác" },
  { id: "XG-02", maXuong: "XG-02", tenXuong: "Xưởng may Hoàng Gia (Long An)",         loai: "May quần",  diaChi: "Bến Lức, Long An",           sdt: "0272-3556-444", email: "hoanggia@xm.vn",       nguoiLH: "Chị Hoa",      congSuat: "600-800 quần/ngày", donGiaTB: 18000, donVi: "đ/quần", ghiChu: "Chuyên quần kaki, quần thể thao",            ngayTao: "2023-05-20", trangThai: "Đang hợp tác" },
  { id: "XG-03", maXuong: "XG-03", tenXuong: "Xưởng in Bảo Ngân (TP.HCM)",            loai: "In/Thêu/Dập", diaChi: "Q.12, TP.HCM",              sdt: "028-3715-1111", email: "baongan@in.vn",         nguoiLH: "Anh Bảo",      congSuat: "2,000-3,000 sp/ngày", donGiaTB: 2500, donVi: "đ/sp",  ghiChu: "In lụa, dập nhiệt, thêu vi tính, giao 3-5 ngày",  ngayTao: "2023-06-15", trangThai: "Đang hợp tác" },
  { id: "XG-04", maXuong: "XG-04", tenXuong: "Xưởng thêu Hoàng Anh (Bình Dương)",     loai: "In/Thêu/Dập", diaChi: "Thuận An, Bình Dương",      sdt: "0274-3777-666", email: "hoanganh@theu.vn",      nguoiLH: "Chị Hoàng",    congSuat: "1,500 sp/ngày",   donGiaTB: 4500, donVi: "đ/sp",  ghiChu: "Thêu logo, thêu vi tính, độ chính xác cao",   ngayTao: "2023-07-25", trangThai: "Đang hợp tác" },
  { id: "XG-05", maXuong: "XG-05", tenXuong: "Xưởng may Trung Thành (Bình Dương)",    loai: "May bộ",    diaChi: "Tân Uyên, Bình Dương",       sdt: "0274-3658-999", email: "trungthanh@xm.vn",     nguoiLH: "Anh Thành",    congSuat: "500 bộ/ngày",    donGiaTB: 22000, donVi: "đ/bộ",  ghiChu: "Chuyên bộ trụ, bộ thể thao, có cắt may đầy đủ", ngayTao: "2023-08-10", trangThai: "Đang hợp tác" },
];

// ============ TỔNG KẾT ============
export const MASTER_DATA_SUMMARY = {
  tongNCC: NCC_FULL.length,
  tongKHSi: KH_SI_FULL.length,
  tongXuong: XUONG_GIA_CONG.length,
  tongDoiTac: 35,        // Từ lib/doi-tac-gia-cong.ts
  tongUser: 32,          // 19 nội bộ + 13 CN
  tongNV: 18,            // NV001-NV018
  tongCongNoKH: KH_SI_FULL.reduce((s, k) => s + k.congNoHT, 0),
  tongCongNoNCC: NCC_FULL.reduce((s, n) => s + n.congNo, 0),
  tongDoanhSoKH: KH_SI_FULL.reduce((s, k) => s + k.doanhSoNam, 0),
};

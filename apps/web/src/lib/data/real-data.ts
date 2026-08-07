// Real data from Excel v2 - Nhan_su + Doi_tac_NCC + Data_Setup
// Generated: 2026-07-23

export type NhanSu = {
  stt: number;
  maNV: string;
  hoTen: string;
  boPhan: string;
  chucVu: string;
  ngaySinh: string;
  gioiTinh: string;
  cccd: string;
  ngayCap: string;
  noiCap: string;
  sdt: string;
  email: string;
  diaChiTT: string;
  diaChiTamTru: string;
  viTri: string;
  ngayVaoLam: string;
  loaiHD: string;
  tinhTrangHN: string;
  soTK: string;
  nganHang: string;
  mst: string;
  bhxh: string;
  trangThai: string;
  luongCB: number;
  loaiLuong: string;
};

export type DoiTac = {
  stt: number;
  maDT: string;
  tenDonVi: string;
  nguoiLH: string;
  sdt: string;
  email: string;
  diaChi: string;
  boPhan: string;
  chucVu: string;
  soTK: string;
  nganHang: string;
  mst: string;
  loaiDT: string;
  trangThai: "Đang hợp tác" | "Ít làm" | "Ngưng";
  congDoan: string;
  ghiChu: string;
};

export type LuongCung = {
  stt: number;
  hoTen: string;
  viecChinh: string;
  luongThang: number;
};

export type LuongSP = {
  stt: number;
  hoTen: string;
  viecChinh: string;
  donGia: string;
  ghiChu: string;
  rates?: { label: string; value: number }[];
};

export type NCC = {
  stt: number;
  ten: string;
  vaiTro: string;
  donGia: string;
  congNo: number;
};

export type KhachHang = {
  stt: number;
  maKH: string;
  ten: string;
  sdt: string;
  email?: string;
  diaChi?: string;
  mst?: string;
  congNo: number;
  rating?: number;
  ghiChu?: string;
};

export const KHACH_HANG_DATA: KhachHang[] = [
  { stt: 1, maKH: "KH-001", ten: "Cty May Hà Nội", sdt: "0912345678", email: "info@mayhanoi.vn", diaChi: "Hà Nội", mst: "0123456789", congNo: 0, rating: 4.8, ghiChu: "KH VIP, đặt hàng định kỳ mỗi tháng" },
  { stt: 2, maKH: "KH-002", ten: "Shop Thời Trang Sài Gòn", sdt: "0987654321", email: "shop@ttgsaigon.vn", diaChi: "Quận 1, TP.HCM", mst: "0234567890", congNo: 0, rating: 4.5, ghiChu: "Đặt hàng theo mùa" },
  { stt: 3, maKH: "KH-003", ten: "Xưởng may Minh Tâm", sdt: "0901234567", email: "minhtam@xmg.vn", diaChi: "Bình Dương", congNo: 0, rating: 4.2 },
  { stt: 4, maKH: "KH-004", ten: "Cty Dệt Phong Phú", sdt: "0934567890", email: "phongphu@det.vn", diaChi: "Đồng Nai", mst: "0345678901", congNo: 0, rating: 4.0, ghiChu: "Đối tác cũ" },
  { stt: 5, maKH: "KH-005", ten: "Xưởng may Hoàng Long", sdt: "0945678901", email: "hoanglong@xmg.vn", diaChi: "Long An", congNo: 0, rating: 4.3 },
  { stt: 6, maKH: "KH-006", ten: "Cty May Việt Hưng", sdt: "0923456789", email: "viethung@may.vn", diaChi: "TP.HCM", mst: "0456789012", congNo: 0, rating: 3.8 },
  { stt: 7, maKH: "KH-007", ten: "Shop Đồng Phục Sài Gòn", sdt: "0938765432", email: "dongphuc@sg.vn", diaChi: "Quận 3, TP.HCM", congNo: 0, rating: 4.6 },
  { stt: 8, maKH: "KH-008", ten: "Cty Thời Trang Bảo Long", sdt: "0941234567", email: "baolong@tt.vn", diaChi: "Hải Phòng", congNo: 0, rating: 4.1 },
];

// ========== 1. NHÂN SỰ (17 NV) - từ Excel ==========
export const NHAN_SU: NhanSu[] = [
  { stt: 1, maNV: "GS002", hoTen: "NGUYỄN THỊ MỸ NHI", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "25/12/2007", gioiTinh: "Nữ", cccd: "80307011543", ngayCap: "29/03/2022", noiCap: "long an", sdt: "901207771", email: "Nguyennhi192145@gmail.com", diaChiTT: "Ấp 4, Thạch Hưng, Tân Hưng, Long An", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "ACB-42718017", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 2, maNV: "GS003", hoTen: "VÕ THỊ PHƯỜNG", boPhan: "Sản xuất", chucVu: "Tổ trưởng", ngaySinh: "08/10/1993", gioiTinh: "Nữ", cccd: "44193001084", ngayCap: "18/01/2023", noiCap: "TP.HCM", sdt: "702501456", email: "vop61089@gmail.com", diaChiTT: "Tổ 4, Ấp 11, Mỹ Thành Nam, Cai Lậy, Tiền Giang", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "ACB-32696157", nganHang: "", mst: "", bhxh: "4420709212", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 3, maNV: "GS004", hoTen: "NGUYỄN NGỌC CẨM VY", boPhan: "Marketing", chucVu: "Nhân viên", ngaySinh: "12/09/2005", gioiTinh: "Nữ", cccd: "79305019752", ngayCap: "18/09/2022", noiCap: "TP.HCM", sdt: "779182053", email: "nvy967300@gmail.com", diaChiTT: "1/12C Hưng Lân, Bà Điểm, Hóc Môn, TP.HCM", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0779182053", nganHang: "", mst: "", bhxh: "7936931518", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 4, maNV: "GS005", hoTen: "ĐỖ THỊ HUYỀN", boPhan: "Kinh doanh", chucVu: "Nhân viên", ngaySinh: "14/04/2003", gioiTinh: "Nữ", cccd: "64303003705", ngayCap: "13/04/2021", noiCap: "gia lai", sdt: "376327699", email: "dohuyencpr81@gmail.com", diaChiTT: "Thôn Hoàng Yên, La Phìn, Chư prong, Gia Lai", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0376327699", nganHang: "", mst: "", bhxh: "6422232561", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 5, maNV: "GS006", hoTen: "BÙI THỊ THANH", boPhan: "Kế toán", chucVu: "Tổ trưởng", ngaySinh: "15/11/1999", gioiTinh: "Nữ", cccd: "36199016242", ngayCap: "06/12/2024", noiCap: "nam định", sdt: "911546004", email: "buithanh151199@gmail.com", diaChiTT: "xã yên cường, tỉnh ninh bình", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0911546004", nganHang: "", mst: "", bhxh: "3622387273", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 6, maNV: "GS007", hoTen: "NGUYỄN THỊ BÉ", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "15/05/1979", gioiTinh: "Nữ", cccd: "83179005680", ngayCap: "24/10/2025", noiCap: "vĩnh long", sdt: "363073998", email: "bekhuong1505@gmail.com", diaChiTT: "Ấp Thanh thủy, Đồng Khởi, Vĩnh Long", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "sacombank-060260103434", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 7, maNV: "GS008", hoTen: "HUỲNH XUÂN HÒA", boPhan: "Marketing", chucVu: "Nhân viên", ngaySinh: "16/03/2004", gioiTinh: "Nam", cccd: "52204008944", ngayCap: "18/01/2021", noiCap: "cục cảnh sát", sdt: "334536752", email: "xhoa14052004@gmail.com", diaChiTT: "an hòa, nhơn khánh, an phơn, bình định", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "1502160304444 mbbank", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 8, maNV: "GS009", hoTen: "NGUYỄN MINH ĐỨC", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "14/09/1990", gioiTinh: "Nam", cccd: "79090017117", ngayCap: "05/09/2022", noiCap: "củ chi", sdt: "365052474", email: "nguyenminhduc199024@gmail.com", diaChiTT: "02 đường số 19, tân định, tân thông hội,củ chi", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0365052474", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 9, maNV: "GS010", hoTen: "TRƯƠNG MINH TÂM", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "13/01/1991", gioiTinh: "Nam", cccd: "79091026055", ngayCap: "04/05/2021", noiCap: "HCM", sdt: "343513417", email: "truongtam2044@gmail.com", diaChiTT: "c9 bis, KP1, đông hưng thuận, quận 12, hcm", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "vietinbank- 107872135480", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 10, maNV: "GS011", hoTen: "LÊ ĐỊNH", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "23/09/2004", gioiTinh: "Nam", cccd: "", ngayCap: "", noiCap: "cục cảnh sát", sdt: "", email: "", diaChiTT: "phong hải, phong điền tỉnh thừa thiên huế", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 11, maNV: "GS012", hoTen: "DƯƠNG TẤN VĨNH", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "31/12/2005", gioiTinh: "Nam", cccd: "89205009111", ngayCap: "10/08/2021", noiCap: "an giang", sdt: "392123831", email: "duongvinh3102005@gmail.com", diaChiTT: "An thạnh chung, chợ mới, An Giang", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "AGRIBANK-6711281019530", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 12, maNV: "GS013", hoTen: "NGUYỄN QUỐC MINH", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "13/11/2009", gioiTinh: "Nam", cccd: "91209019977", ngayCap: "", noiCap: "an giang", sdt: "332026731", email: "minhnho686868680@gmail.com", diaChiTT: "An thạnh, An Phú, An Giang", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0332026731", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 13, maNV: "GS014", hoTen: "TRƯƠNG VĂN NHẪN", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "14/02/2009", gioiTinh: "Nam", cccd: "94209008345", ngayCap: "06/06/2023", noiCap: "sóc trăng", sdt: "345141953", email: "trvannhan1402@gmail.com", diaChiTT: "khóm tân thành, phường 2, ngã năm, sóc trăng", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0365323187", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 14, maNV: "GS015", hoTen: "NGUYỄN QUỐC HẬU", boPhan: "Kho vận", chucVu: "Nhân viên", ngaySinh: "26/03/1997", gioiTinh: "Nam", cccd: "79097033092", ngayCap: "26/11/2025", noiCap: "hcm", sdt: "386231456", email: "Beo26032019@gmail.com", diaChiTT: "29/2E ấp đông Lân, Bà Điểm, HCM", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "MB-0386231456", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 15, maNV: "GS016", hoTen: "LƯƠNG HOÀNG PHI", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "22/05/1994", gioiTinh: "Nam", cccd: "79094005478", ngayCap: "", noiCap: "hcm", sdt: "938625594", email: "fizxnm2251994@mail.com", diaChiTT: "312/37 Gò Dầu, Tân Sơn Nhì, HCM", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 16, maNV: "GS017", hoTen: "NGUYỄN VĂN RUỘNG", boPhan: "Sản xuất", chucVu: "Công nhân", ngaySinh: "22/12/1987", gioiTinh: "Nam", cccd: "89087019874", ngayCap: "08/05/2022", noiCap: "an giang", sdt: "339724459", email: "nguyenvanruong14@gmail.com", diaChiTT: "Ấp Trung Hòa, Tân Trung, Phú Tân, An Giang", diaChiTamTru: "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", viTri: "", ngayVaoLam: "", loaiHD: "", tinhTrangHN: "", soTK: "msb-04401016998851", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
  { stt: 20, maNV: "NV001", hoTen: "Đặng Văn Sơn", boPhan: "Kho vận", chucVu: "Tổ trưởng", ngaySinh: "10/05/1985", gioiTinh: "Nam", cccd: "12345678901", ngayCap: "", noiCap: "", sdt: "981234567", email: "son.dang@gmail.com", diaChiTT: "", diaChiTamTru: "", viTri: "Thủ kho trưởng", ngayVaoLam: "15/01/2020", loaiHD: "", tinhTrangHN: "", soTK: "", nganHang: "", mst: "", bhxh: "", trangThai: "dang_lam", luongCB: 0, loaiLuong: "" },
];

// ========== 2. ĐỐI TÁC GIA CÔNG (35 đối tác) - từ Excel ==========
export const DOI_TAC: DoiTac[] = [
  { stt: 1, maDT: "GC-IN-001", tenDonVi: "Xưởng in/thêu/dập Bảo Ngân", nguoiLH: "Bảo Ngân", sdt: "978417243", email: "", diaChi: "b13/1a/15c ấp 2, xã tân vĩnh lộc, tphcm", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 2, maDT: "GC-IN-002", tenDonVi: "Xưởng in/thêu/dập Hạnh", nguoiLH: "Hạnh", sdt: "374592478", email: "", diaChi: "ấp mỹ hòa 2, xuân thới sơn, hcm", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "" },
  { stt: 3, maDT: "GC-IN-003", tenDonVi: "Xưởng in/thêu/dập Thanh Sơn", nguoiLH: "Thanh Sơn", sdt: "937557261", email: "", diaChi: "219/1/1 đường 12,bình tân", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "" },
  { stt: 4, maDT: "GC-IN-004", tenDonVi: "Xưởng in/thêu/dập Tiến Đạt", nguoiLH: "Tiến Đạt", sdt: "987700589", email: "", diaChi: "48 nguyễn văn vinh, phú thạnh, hcm", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "" },
  { stt: 5, maDT: "GC-IN-005", tenDonVi: "Xưởng in/thêu/dập Trung", nguoiLH: "Trung", sdt: "", email: "", diaChi: "khánh hòa nha trang", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "" },
  { stt: 6, maDT: "GC-IN-006", tenDonVi: "Xưởng in/thêu/dập Vui", nguoiLH: "Vui", sdt: "373779959", email: "", diaChi: "đông hưng thuận 03, quận 12", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "" },
  { stt: 7, maDT: "GC-IN-007", tenDonVi: "NGỌC QUÝ TP", nguoiLH: "Huỳnh Thanh Phong", sdt: "932003935", email: "", diaChi: "3/23, Hẻm 161, đường ĐHT02, Q. Tân Bình, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "72085011458", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "In / Thêu / Dập", ghiChu: "CCCD: 072085011458 - Cấp: 10/02/2025 - MST: 072085011458" },
  { stt: 8, maDT: "GC-QUAN-001", tenDonVi: "NGUYỄN THỊ NGỌC DUNG", nguoiLH: "Nguyễn Thị Ngọc Dung", sdt: "383373415", email: "", diaChi: "Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "8898968687-001", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May quần", ghiChu: "CCCD: 091183000355 - Cấp: 27/03/2022" },
  { stt: 9, maDT: "GC-QUAN-002", tenDonVi: "NHÀ MAY MINH VY", nguoiLH: "Tổng Thị Minh", sdt: "362044839", email: "", diaChi: "27/6C Hưng Lân, Xã Bà Điểm, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May quần", ghiChu: "CCCD: 38187008969 - Cấp: 25/08/2022" },
  { stt: 10, maDT: "GC-QUAN-003", tenDonVi: "Xưởng may quần anh Thơ", nguoiLH: "Tăng Văn Thơ", sdt: "766769562", email: "", diaChi: "Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May quần", ghiChu: "CCCD: 83084003261" },
  { stt: 11, maDT: "GC-QUAN-004", tenDonVi: "LÊ THỊ HOÀI HƯƠNG", nguoiLH: "Lê Thị Hoài Hương", sdt: "941104007", email: "", diaChi: "Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đăk Lăk", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "66190017850", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May quần", ghiChu: "CCCD: 066190017850" },
  { stt: 12, maDT: "GC-TRON-001", tenDonVi: "Xưởng may tròn anh Trai", nguoiLH: "Nguyễn Ngọc Trai", sdt: "908908167", email: "", diaChi: "Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "CCCD: 0520082013001" },
  { stt: 13, maDT: "GC-TRON-002", tenDonVi: "Xưởng may tròn chị Hằng", nguoiLH: "Hằng", sdt: "909802852", email: "", diaChi: "41/1C Hưng Lân, Bà Điểm, Hóc Môn", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 14, maDT: "GC-TRON-003", tenDonVi: "Xưởng may tròn anh Chiến", nguoiLH: "Chiến", sdt: "986747344", email: "", diaChi: "1/8/13 Tân Thới Nhất 22, hẻm 123, Q.12", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 15, maDT: "GC-TRON-004", tenDonVi: "Xưởng may tròn anh Thuận", nguoiLH: "Thuận", sdt: "903071501", email: "", diaChi: "28/10/15 KP40, Tân Thới Nhất 11, Q.12", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 16, maDT: "GC-TRON-005", tenDonVi: "Xưởng may quang", nguoiLH: "Quang", sdt: "966670624", email: "", diaChi: "133/42 liên khu 4, khu phố 5, phường binh hưng hòa B, quận bình tân", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 17, maDT: "GC-TRON-006", tenDonVi: "TRƯƠNG HOÀNG TUẤN 1", nguoiLH: "Trương Hoàng Tuấn", sdt: "989918562", email: "", diaChi: "67 đường số 9, KP 29, P. Bình Hưng Hòa, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "8045628381-001", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "CCCD: 46087000011" },
  { stt: 18, maDT: "GC-TRON-007", tenDonVi: "Xưởng may ánh", nguoiLH: "đinh văn ánh", sdt: "", email: "", diaChi: "17/2 xtt 7-2-1 trần vưn mười, ấp 14, bà điểm, hcm", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "319106963", loaiDT: "doi_tac_gia_cong", trangThai: "Ngưng", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 19, maDT: "GC-TRON-008", tenDonVi: "Xưởng may kiếm", nguoiLH: "Kiếm", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 20, maDT: "GC-TRON-009", tenDonVi: "Xưởng may kiên", nguoiLH: "Kiên", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 21, maDT: "GC-TRON-010", tenDonVi: "Xưởng may mộng", nguoiLH: "Mộng", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 22, maDT: "GC-TRON-011", tenDonVi: "Xưởng may phúc", nguoiLH: "lê hoàng phúc", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 23, maDT: "GC-TRON-012", tenDonVi: "Xưởng may thắng", nguoiLH: "Thắng", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 24, maDT: "GC-TRON-013", tenDonVi: "Xưởng may thiện", nguoiLH: "Thiện", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 25, maDT: "GC-TRON-014", tenDonVi: "Xưởng may trí", nguoiLH: "Trí", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo tròn", ghiChu: "" },
  { stt: 26, maDT: "GC-TRU-001", tenDonVi: "NGUYỄN THỊ NGỌC LIỄU", nguoiLH: "Nguyễn Thị Ngọc Liễu", sdt: "933305465", email: "", diaChi: "594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "83182011101", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "CCCD: 083182011101" },
  { stt: 27, maDT: "GC-TRU-002", tenDonVi: "Xưởng may trụ anh Tý Sơn", nguoiLH: "Nguyễn Hữu Kim Ly Sơn", sdt: "794953483", email: "", diaChi: "Nhà không số ấp 29, Xã Tân Vĩnh Lộc, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "CCCD: 066188019712" },
  { stt: 28, maDT: "GC-TRU-003", tenDonVi: "Xưởng may trụ anh Duẩn", nguoiLH: "Dương Xuân Duẩn", sdt: "966266775", email: "", diaChi: "Đường N11, tổ 1 KP 2, P. Thới Hòa, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "CCCD: 034086003445" },
  { stt: 29, maDT: "GC-TRU-004", tenDonVi: "Xưởng may trụ anh Toàn", nguoiLH: "Toàn", sdt: "799962940", email: "", diaChi: "Ấp 7, xã Bà Điểm, Hóc Môn", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "" },
  { stt: 30, maDT: "GC-TRU-005", tenDonVi: "THÔNG THƯƠNG", nguoiLH: "Nguyễn Văn Thông", sdt: "933305465", email: "", diaChi: "28/8 Ấp 46, Xã Hóc Môn, TP.HCM", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "86090005870", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "CCCD: 086090005870" },
  { stt: 31, maDT: "GC-TRU-006", tenDonVi: "Xưởng may trụ cô Cúc", nguoiLH: "Cúc", sdt: "907869422", email: "", diaChi: "1/5B KP49 Nguyễn Văn Quá, P.Đông Hưng Thuận", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "" },
  { stt: 32, maDT: "GC-TRU-007", tenDonVi: "Xưởng may trụ anh Sản", nguoiLH: "Nguyễn Gia Sản", sdt: "906042853", email: "", diaChi: "Tổ 16 đường Lê Văn Chi, Linh Xuân", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "CCCD: 030080000661" },
  { stt: 33, maDT: "GC-TRU-008", tenDonVi: "Xưởng may bình", nguoiLH: "Bình", sdt: "", email: "", diaChi: "", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "" },
  { stt: 34, maDT: "GC-TRU-009", tenDonVi: "Xưởng may hiền", nguoiLH: "Hiền", sdt: "352186386", email: "", diaChi: "ấp mới 1, xã myc hạnh nam huyện đức hòa, long an", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "---", loaiDT: "doi_tac_gia_cong", trangThai: "Đang hợp tác", congDoan: "May áo trụ", ghiChu: "" },
  { stt: 35, maDT: "GC-TRU-010", tenDonVi: "Xưởng may toản", nguoiLH: "Toản", sdt: "942044799", email: "", diaChi: "30 đường tk8, ấp tiền lân, bà ddiemr, hóc môn", boPhan: "Sản xuất", chucVu: "Công nhân", soTK: "", nganHang: "", mst: "313905409", loaiDT: "doi_tac_gia_cong", trangThai: "Ngưng", congDoan: "May áo trụ", ghiChu: "" },
];

// ========== DANH SÁCH NHÀ CUNG CẤP VẢI / PHỤ LIỆU ==========
export const NHA_CUNG_CAP = [
  { maNCC: "NCC-001", tenDonVi: "Công ty Dệt kim Đông Xuân" },
  { maNCC: "NCC-002", tenDonVi: "Nhà máy dệt Thái Tuấn" },
  { maNCC: "NCC-003", tenDonVi: "Nhà cung cấp vải sợi Hưng Thịnh" },
  { maNCC: "NCC-004", tenDonVi: "Công ty Phụ liệu may mặc YKK" },
  { maNCC: "NCC-005", tenDonVi: "Chợ vải Soái Kình Lâm - Sạp A1" },
  { maNCC: "NCC-006", tenDonVi: "Công ty CP Dệt May Đầu Tư Thương Mại Hoà Thọ" },
];

// ========== 3. LOOKUP DATA (Bộ phận + Chức vụ) ==========
export const BO_PHAN: string[] = [
  "Ban Giám Đốc", "Kinh doanh", "Sản xuất", "Kế toán", "Nhân sự", "Kho vận", "Marketing", "Thiết kế", "IT",
];

export const CHUC_VU: string[] = [
  "Giám đốc", "Phó Giám đốc", "Trưởng phòng", "Phó phòng", "Tổ trưởng", "Nhân viên", "Công nhân", "Thực tập sinh",
];

// ========== 4. LƯƠNG CỨNG (giữ từ data cũ) ==========
export const LUONG_CUNG: LuongCung[] = [
  { stt: 8, hoTen: "BÙI THỊ THANH", viecChinh: "Kế toán điều phối SX", luongThang: 8_000_000 },
  { stt: 9, hoTen: "ĐỖ THỊ HUYỀN", viecChinh: "QL Khách hàng Sỉ", luongThang: 7_000_000 },
  { stt: 10, hoTen: "NGUYỄN NGỌC CẨM VY", viecChinh: "Content - Media", luongThang: 8_000_000 },
  { stt: 11, hoTen: "HUỲNH XUÂN HÒA", viecChinh: "Chưa phân công", luongThang: 10_000_000 },
  { stt: 12, hoTen: "NGUYỄN QUỐC HẬU", viecChinh: "Nhân viên Kho", luongThang: 7_000_000 },
  { stt: 13, hoTen: "NGUYỄN THỊ HOÀNG OANH", viecChinh: "Chưa phân công", luongThang: 12_000_000 },
];

// ========== 5. LƯƠNG SẢN PHẨM (giữ từ data cũ) ==========
export const LUONG_SP: LuongSP[] = [
  { stt: 1, hoTen: "Nguyễn Văn Ruộng", viecChinh: "Khuy nút", donGia: "750", ghiChu: "Áp dụng chung", rates: [{ label: "Mỗi nút", value: 750 }] },
  { stt: 2, hoTen: "Nguyễn Minh Đức", viecChinh: "Ủi", donGia: "800/700/600", ghiChu: "Áo trụ: 800, Áo tròn: 700, Quần: 600", rates: [
    { label: "Áo trụ", value: 800 }, { label: "Áo tròn", value: 700 }, { label: "Quần", value: 600 },
  ] },
  { stt: 3, hoTen: "Lê Định", viecChinh: "Ủi", donGia: "800/700/600", ghiChu: "Áo trụ: 800, Áo tròn: 700, Quần: 600", rates: [
    { label: "Áo trụ", value: 800 }, { label: "Áo tròn", value: 700 }, { label: "Quần", value: 600 },
  ] },
  { stt: 4, hoTen: "Trương Minh Tâm", viecChinh: "Ủi", donGia: "800/700/600", ghiChu: "Áo trụ: 800, Áo tròn: 700, Quần: 600", rates: [
    { label: "Áo trụ", value: 800 }, { label: "Áo tròn", value: 700 }, { label: "Quần", value: 600 },
  ] },
  { stt: 5, hoTen: "Nguyễn Thị Mỹ Nhi", viecChinh: "Gấp xếp", donGia: "1300/800/1500/1000", ghiChu: "Bộ thường: 1300, Áo thường: 800, Bộ trắng: 1500, Áo trắng: 1000", rates: [
    { label: "Bộ thường", value: 1300 }, { label: "Áo thường", value: 800 }, { label: "Bộ trắng", value: 1500 }, { label: "Áo trắng", value: 1000 },
  ] },
  { stt: 6, hoTen: "Võ Thị Mỹ Phương", viecChinh: "Gấp xếp", donGia: "1300/800/1500/1000", ghiChu: "Bộ thường: 1300, Áo thường: 800, Bộ trắng: 1500, Áo trắng: 1000", rates: [
    { label: "Bộ thường", value: 1300 }, { label: "Áo thường", value: 800 }, { label: "Bộ trắng", value: 1500 }, { label: "Áo trắng", value: 1000 },
  ] },
  { stt: 7, hoTen: "Nguyễn Thị Bé", viecChinh: "Gấp xếp", donGia: "1300/800/1500/1000", ghiChu: "Bộ thường: 1300, Áo thường: 800, Bộ trắng: 1500, Áo trắng: 1000", rates: [
    { label: "Bộ thường", value: 1300 }, { label: "Áo thường", value: 800 }, { label: "Bộ trắng", value: 1500 }, { label: "Áo trắng", value: 1000 },
  ] },
  { stt: 14, hoTen: "PHẠM VĂN ĐỆ", viecChinh: "Cắt", donGia: "1400/1200/900", ghiChu: "Áo trụ: 1400, Áo tròn: 1200, Quần: 900", rates: [
    { label: "Áo trụ", value: 1400 }, { label: "Áo tròn", value: 1200 }, { label: "Quần", value: 900 },
  ] },
  { stt: 15, hoTen: "DƯƠNG TẤN VĨNH", viecChinh: "Cắt", donGia: "1400/1200/900", ghiChu: "Áo trụ: 1400, Áo tròn: 1200, Quần: 900", rates: [
    { label: "Áo trụ", value: 1400 }, { label: "Áo tròn", value: 1200 }, { label: "Quần", value: 900 },
  ] },
  { stt: 16, hoTen: "NGUYỄN QUỐC MINH", viecChinh: "Cắt", donGia: "1400/1200/900", ghiChu: "Áo trụ: 1400, Áo tròn: 1200, Quần: 900", rates: [
    { label: "Áo trụ", value: 1400 }, { label: "Áo tròn", value: 1200 }, { label: "Quần", value: 900 },
  ] },
  { stt: 17, hoTen: "TRƯƠNG VĂN NHẪN", viecChinh: "Cắt", donGia: "1400/1200/900", ghiChu: "Áo trụ: 1400, Áo tròn: 1200, Quần: 900", rates: [
    { label: "Áo trụ", value: 1400 }, { label: "Áo tròn", value: 1200 }, { label: "Quần", value: 900 },
  ] },
];

// ========== 6. NHÀ CUNG CẤP (16 NCC) ==========
export const NCCS: NCC[] = [
  { stt: 1, ten: "Công ty Lucky Avanti", vaiTro: "Bán sợi", donGia: "", congNo: 0 },
  { stt: 2, ten: "Công ty TNHH Thương mại Quốc tế Sammoon", vaiTro: "Bán sợi", donGia: "", congNo: 909_052_000 },
  { stt: 3, ten: "Công ty TNHH Sản xuất Thương mại Dệt May Hải Dương", vaiTro: "Dệt", donGia: "10.000 đ/kg", congNo: 183_944_000 },
  { stt: 4, ten: "Công ty TNHH Một thành viên Dệt Nhuộm Thái Thành", vaiTro: "Nhuộm", donGia: "", congNo: 0 },
  { stt: 5, ten: "Công ty Cổ phần Dệt Nhuộm Phú Long", vaiTro: "Bo cổ", donGia: "", congNo: 184_369_120 },
  { stt: 6, ten: "Hộ kinh doanh Vũ Văn Hiệp", vaiTro: "Bo cổ", donGia: "", congNo: 74_315_000 },
  { stt: 7, ten: "Công ty TNHH Phụ liệu May mặc Tường Vy", vaiTro: "Thun & Giấy gấp xếp", donGia: "", congNo: 10_200_000 },
  { stt: 8, ten: "Công ty TNHH Thương mại Dịch vụ Hằng Lữ", vaiTro: "Dây kéo", donGia: "", congNo: 91_500_000 },
  { stt: 9, ten: "(chưa có tên) — Dây xỏ mạc", vaiTro: "Dây xỏ mạc", donGia: "", congNo: 0 },
  { stt: 10, ten: "(chưa có tên) — Dây luồn quần", vaiTro: "Dây luồn quần", donGia: "", congNo: 0 },
  { stt: 11, ten: "Công ty TNHH Sản xuất và Thương mại Nhãn mác Hải Nam", vaiTro: "Nhãn thẻ bài", donGia: "", congNo: 0 },
  { stt: 12, ten: "Công ty TNHH In ấn Thông Anh", vaiTro: "Nhãn size", donGia: "", congNo: 21_047_904 },
  { stt: 13, ten: "Công ty TNHH Sản xuất Kinh doanh Thương mại Bao bì Đại Hoàng Phúc", vaiTro: "Túi zip", donGia: "", congNo: 0 },
  { stt: 14, ten: "CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)", vaiTro: "Nhuộm", donGia: "", congNo: 639_347_450 },
  { stt: 15, ten: "CÔNG TY TNHH DỆT BO HẢI ÂU", vaiTro: "Bo cổ", donGia: "", congNo: 31_795_000 },
  { stt: 16, ten: "CÔNG TY TNHH BAO BÌ PHÚC VINH", vaiTro: "Khác", donGia: "", congNo: 3_450_000 },
];

// ========== HELPERS ==========
export const formatVND = (n: number) => {
  const safe = Number(n) || 0;
  if (safe === 0) return "0 đ";
  return safe.toLocaleString("vi-VN") + " đ";
};

export const formatVNDShort = (n: number) => {
  const safe = Number(n) || 0;
  if (safe === 0) return "0";
  if (safe >= 1_000_000_000) return (safe / 1_000_000_000).toFixed(2) + " tỷ";
  if (safe >= 1_000_000) return (safe / 1_000_000).toFixed(0) + " tr";
  return safe.toLocaleString("vi-VN") + " đ";
};
// ========== 7. KHO VẢI (29 loại vải) ==========
export type KhoVai = {
  maVT: string; tenVT: string; loai: string; dvt: string;
  donGia: number; tonKho: number; tonToiThieu: number;
  kho: string; mauSac: string; ghiChu: string;
  soCayNhap: number; tonCay: number;
  // === P2 - 2026-08-07 - Hao hut mac dinh theo vai ===
  tyLeHaoHut?: number; // % (VD: 3 = 3%)
};

export const KHO_VAI: KhoVai[] = [
  { maVT: "V-XAMCHI035", tenVT: "XÁM CHÌ 035", loai: "Vải", dvt: "kg", donGia: 70000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám chì", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XANHDENCM", tenVT: "XANH ĐEN CM", loai: "Vải", dvt: "kg", donGia: 91000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xanh đen", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-MAU11", tenVT: "MÀU 11", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Màu 11", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAM6", tenVT: "XÁM 6 ( 005)", loai: "Vải", dvt: "kg", donGia: 67500.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-BO068", tenVT: "BÒ (068) 26", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Bò", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMMON109", tenVT: "XÁM MÔN 109", loai: "Vải", dvt: "kg", donGia: 0.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám môn", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-DAUXANH114", tenVT: "ĐẬU XANH 114", loai: "Vải", dvt: "kg", donGia: 0.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đậu xanh", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-DO112", tenVT: "ĐỎ 112", loai: "Vải", dvt: "kg", donGia: 0.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đỏ", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMXANH111", tenVT: "XÁM XANH 111", loai: "Vải", dvt: "kg", donGia: 0.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám xanh", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-TRANG003", tenVT: "TRẮNG 003(1)", loai: "Vải", dvt: "kg", donGia: 64000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Trắng", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-COUA044", tenVT: "CỔ UẢ 044", loai: "Vải", dvt: "kg", donGia: 67000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Cổ uả", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XANHNGOC", tenVT: "XANH NGỌC", loai: "Vải", dvt: "kg", donGia: 0.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xanh ngọc", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XANHBICH", tenVT: "VẢI XANH BÍCH", loai: "Vải", dvt: "kg", donGia: 91000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xanh bích", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMLO061", tenVT: "XÁM LỢT 061", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám lợt", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-KEM3", tenVT: "KEM 3", loai: "Vải", dvt: "kg", donGia: 64000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Kem", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-CACAO21", tenVT: "CACAO 21", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Cacao", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMCHI066", tenVT: "XÁM CHÌ 066 ( 20 )", loai: "Vải", dvt: "kg", donGia: 70000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám chì", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-DAXANH", tenVT: "ĐÁ XANH", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đá xanh", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMTRANG2", tenVT: "XÁM TRẮNG 2", loai: "Vải", dvt: "kg", donGia: 64000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám trắng", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XANHDENTH", tenVT: "XANH ĐEN THƯỜNG", loai: "Vải", dvt: "kg", donGia: 69000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xanh đen", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-VANG14", tenVT: "VÀNG 14", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Vàng", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMCHI035N", tenVT: "Poly Nano Xám 035", loai: "Vải", dvt: "kg", donGia: 70000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-DENNANO", tenVT: "Poly Nano Đen", loai: "Vải", dvt: "kg", donGia: 91000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đen", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-XAMNANO", tenVT: "Poly Nano Xám", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-REUNANO", tenVT: "Poly Nano Rêu", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Rêu", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-2DADEN", tenVT: "VẢI 2DA ĐEN", loai: "Vải", dvt: "kg", donGia: 69000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đen", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-2DAREU", tenVT: "VẢI 2DA RÊU", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Rêu", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-2DANAU", tenVT: "VẢI 2DA NÂU ĐẤT", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Nâu đất", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-2DAXAMCHI", tenVT: "VẢI 2DA XÁM CHÌ", loai: "Vải", dvt: "kg", donGia: 71000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Xám chì", ghiChu: "Vải chính", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-COTTON100-TRANG", tenVT: "VẢI COTTON 100% TRẮNG", loai: "Vải", dvt: "kg", donGia: 85000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Trắng", ghiChu: "Vải mới thêm", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "V-CASAUDEN", tenVT: "VẢI CÁ SẤU ĐEN", loai: "Vải", dvt: "kg", donGia: 95000.0, tonKho: 0.0, tonToiThieu: 0.0, kho: "Kho vải", mauSac: "Đen", ghiChu: "Vải mới thêm", soCayNhap: 0.0, tonCay: 0.0 },
];

// ========== 8. KHO PHỤ LIỆU / BO VẬT TƯ (58 mặt hàng) ==========
export type KhoVatTu = KhoVai; // Same structure

export const KHO_VAT_TU: KhoVatTu[] = [
  { maVT: "BO-001", tenVT: "Bo Cổ Trơn - TRẮNG 003(1)", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 1524, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "TRẮNG 003", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-002", tenVT: "Bo Cổ Trơn - KEM", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 480, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "KEM", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-003", tenVT: "Bo Cổ Trơn - KEM 108", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 480, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "KEM 108", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-004", tenVT: "Bo Cổ Trơn - GỪNG 040", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "GỪNG 040", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-005", tenVT: "Bo Cổ Trơn - BEIGE 5V7036", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 200, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "BEIGE 5V7036", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-006", tenVT: "Bo Cổ Trơn - XÁM 005", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 180, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM 005", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-007", tenVT: "Bo Cổ Trơn - CỔ UẢ 044", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 67, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "CỔ UẢ 044", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-008", tenVT: "Bo Cổ Trơn - XÁM XANH 90", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 370, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM XANH 90", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-009", tenVT: "Bo Cổ Trơn - RÊU 036", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 70, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "RÊU 036", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-010", tenVT: "Bo Cổ Trơn - XÁM CHÌ 035", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 125, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM CHÌ 035", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-011", tenVT: "Bo Cổ Trơn - CỔ VỊT 012", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 65, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "CỔ VỊT 012", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-012", tenVT: "Bo Cổ Trơn - ĐEN", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 565, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "ĐEN", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-013", tenVT: "Bo Cổ Trơn - XÁM LỢT 061", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 240, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM LỢT 061", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-014", tenVT: "Bo Cổ Trơn - XÁM 81", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 540, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM 81", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-015", tenVT: "Bo Cổ Trơn - CỔ VỊT 11", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 220, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "CỔ VỊT 11", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-016", tenVT: "Bo Cổ Trơn - XÁM 066", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 340, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM 066", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-017", tenVT: "Bo Cổ Trơn - XANH NHỚT 069", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 960, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XANH NHỚT 069", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-018", tenVT: "Bo Cổ Trơn - CA CAO 21", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 80, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "CA CAO 21", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-019", tenVT: "Bo Cổ Trơn - XÁM MÔN", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 230, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XÁM MÔN", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-020", tenVT: "Bo Cổ Trơn - ĐỎ", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 40, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "ĐỎ", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-021", tenVT: "Bo Cổ Trơn - XANH ĐEN", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 460, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "XANH ĐEN", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-022", tenVT: "Bo Cổ Trơn - BÒ 068", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "BÒ 068", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-023", tenVT: "Bo Cổ 2 da trắng sọc xanh đen tay trắng", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 360, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-024", tenVT: "Bo Cổ 2 da trắng sọc xanh đen tay đen", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 400, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-025", tenVT: "Bo Cổ 2 da trắng sọc đen+gừng tay đen", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 220, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-026", tenVT: "Bo Cổ 2 da trắng sọc đen+gừng tay trắng", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 350, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-027", tenVT: "Bo Cổ 2 da trắng sọc đen+gừng tay kem", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 200, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-028", tenVT: "Bo Cổ 2 da gừng sọc đen tay gừng", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 90, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-029", tenVT: "Bo Cổ 2 da trắng sọc đen tay đen", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 110, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-030", tenVT: "Bo Cổ 2 da đen sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 7200, tonKho: 450, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-031", tenVT: "Bo trắng sọc đỏ", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 200, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-032", tenVT: "Bo trắng sọc đỏ+xanh", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 240, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-033", tenVT: "Bo đỏ +2 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 100, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-034", tenVT: "Bo xám chì 035 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 240, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-035", tenVT: "Bo đen 2 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 100, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-036", tenVT: "Bo xanh đen sọc trắng đỏ", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 240, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-037", tenVT: "Bo đỏ 2 sọc trắng xanh lá", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 170, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-038", tenVT: "Bo 1 sọc xám 005 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 135, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-039", tenVT: "Bo 1 sọc xám 035 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 110, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-040", tenVT: "Bo 1 sọc xanh nhớt 069 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 120, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-041", tenVT: "Bo 2 sọc nhí rêu 036 sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 90, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-042", tenVT: "Bo 2 sọc nhí đen sọc gừng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 140, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-043", tenVT: "Bo 1 sọc nhí ca cao sọc bò 068", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 370, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-044", tenVT: "Bo 1 sọc nhí xanh đen sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 60, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-045", tenVT: "Bo 1 sọc nhí cỏ úa sọc trắng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 250, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-046", tenVT: "Bo 1 sọc nhí gừng sọc đen", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 150, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BO-047", tenVT: "Bo 1 sọc nhí đen sọc gừng", loai: "Bo cổ", dvt: "bộ", donGia: 6000, tonKho: 60, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "(Nhiều màu)", ghiChu: "", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "BAOBI_GIAY", tenVT: "Bao bì + Giấy", loai: "Phụ liệu", dvt: "sp", donGia: 700, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "", ghiChu: "Chi phí cố định", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "THEBAI", tenVT: "Thẻ bài", loai: "Phụ liệu", dvt: "sp", donGia: 700, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "", ghiChu: "Chi phí cố định", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "DAYKEO", tenVT: "Dây kéo", loai: "Phụ liệu", dvt: "sp", donGia: 1400, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "", ghiChu: "Chi phí cố định", soCayNhap: 0.0, tonCay: 0.0 },
  { maVT: "THUNQUAN", tenVT: "Thun quần", loai: "Phụ liệu", dvt: "sp", donGia: 1500, tonKho: 0, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "", ghiChu: "Chi phí cố định", soCayNhap: 0.0, tonCay: 0.0 }
];

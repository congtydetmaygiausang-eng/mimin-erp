// 4 LSX bổ sung - data thật theo workflow chị Giàu
// M111: Áo polo trắng, M222: Bộ thể thao nam, M333: Áo sơ mi nữ, M555: Quần kaki

import type { PhieuWorkflow } from "./workflow-data";

export const MORE_LSX: PhieuWorkflow[] = [
  // ============ LSX-2026-003: M111 - Áo polo trắng 800 áo ============
  // Cắt - NV008 (Phú) - 800 áo polo
  {
    id: "CAT_003", lenhSX: "LSX-2026-003", lenhCat: "LC-M111", maSP: "M111",
    phanLoai: "Áo polo", kieuMay: "Cổ bẻ", mau: "Trắng", size: "M, L, XL",
    soLuongGiao: 800, soLuongNhan: 800, soLuongDat: 795, soLuongLoi: 5, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "NV008", tenNguoiNhan: "Hồ Văn Minh Phú (Cắt)",
    ngayGiao: "2026-07-18", ngayNhan: "2026-07-18", ngayHoanThanh: "2026-07-21",
    hanHoanThanh: "2026-07-21",
    donGia: 1200, thanhTien: 795 * 1200, daThanhToan: 0, conNo: 795 * 1200,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Cắt áo polo cổ bẻ. 1.200đ × 795 = 954K. Lỗi 5 áo (vải bẩn)",
  },
  // May áo - Cúc (outsource)
  {
    id: "MAY_004", lenhSX: "LSX-2026-003", lenhCat: "LC-M111", maSP: "M111",
    phanLoai: "Áo polo", kieuMay: "Cổ bẻ", mau: "Trắng", size: "M, L, XL",
    soLuongGiao: 800, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-010", tenNguoiNhan: "Cúc (May áo polo, ngoài)",
    ngayGiao: "2026-07-22", hanHoanThanh: "2026-08-01", donGia: 4200, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Outsource may áo polo. Đơn giá 4.200đ",
  },
  // Khuy nút - NV017 (Ruộng)
  {
    id: "KN_003", lenhSX: "LSX-2026-003", lenhCat: "LC-M111", maSP: "M111",
    phanLoai: "Áo polo", mau: "Trắng", size: "M, L, XL",
    soLuongGiao: 800, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV017", tenNguoiNhan: "Nguyễn Văn Ruộng (Khuy nút)",
    hanHoanThanh: "2026-08-02", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Đơn giá 750đ/cái",
  },
  // Ủi - NV012 (Huynh)
  {
    id: "UI_003", lenhSX: "LSX-2026-003", lenhCat: "LC-M111", maSP: "M111",
    phanLoai: "Áo polo", mau: "Trắng", size: "M, L, XL",
    soLuongGiao: 800, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV012", tenNguoiNhan: "Phạm Văn Huynh (Ủi)",
    hanHoanThanh: "2026-08-03", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Ủi áo polo. 4 NV ủi",
  },
  // Gấp xếp - NV016 (Phiên)
  {
    id: "DG_003", lenhSX: "LSX-2026-003", lenhCat: "LC-M111", maSP: "M111",
    phanLoai: "Áo polo", mau: "Trắng", size: "M, L, XL",
    soLuongGiao: 800, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV016", tenNguoiNhan: "Trần Thị Bé Phiên (Gấp xếp)",
    hanHoanThanh: "2026-08-04", donGia: 1000, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Gấp áo polo. 1.000đ/áo",
  },

  // ============ LSX-2026-004: M222 - Bộ thể thao nam 1,200 bộ ============
  // Cắt - NV007 (Đệ)
  {
    id: "CAT_004", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Bộ thể thao nam", kieuMay: "Bo gấu", mau: "Xanh navy", size: "M, L, XL, XXL",
    soLuongGiao: 1200, soLuongNhan: 1200, soLuongDat: 1196, soLuongLoi: 4, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "NV007", tenNguoiNhan: "Phạm Văn Đệ (Cắt)",
    ngayGiao: "2026-07-19", ngayNhan: "2026-07-19", ngayHoanThanh: "2026-07-23",
    hanHoanThanh: "2026-07-23",
    donGia: 1400, thanhTien: 1196 * 1400, daThanhToan: 0, conNo: 1196 * 1400,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Cắt bộ thể thao (áo trụ + quần). 1.400đ × 1196 = 1,674,400đ. Lỗi 4 bộ",
  },
  // In/Thêu logo - Thanh Sơn
  {
    id: "INTD_003", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Bộ thể thao", mau: "Xanh navy", size: "M, L, XL, XXL",
    viTriIn: "Thêu logo POLOMIMIN trước ngực",
    soLuongGiao: 1200, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV001", nguoiNhan: "DT-IN-003", tenNguoiNhan: "Thanh Sơn (Thêu, ngoài)",
    ngayGiao: "2026-07-24", hanHoanThanh: "2026-07-30", donGia: 0, thanhTien: 0, daThanhToan: 500000, conNo: 0,
    trangThai: "Đang làm", mauDaDuyet: true, nguoiXacNhan: "Nguyễn Thị Ngọc Giàu",
    ghiChu: "Outsource thêu logo. Tạm ứng 500K",
  },
  // May - Liễu
  {
    id: "MAY_005", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Bộ thể thao", kieuMay: "Bo gấu", mau: "Xanh navy", size: "M, L, XL, XXL",
    soLuongGiao: 1200, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-011", tenNguoiNhan: "Liễu (May áo, ngoài)",
    ngayGiao: "2026-07-26", hanHoanThanh: "2026-08-05", donGia: 4500, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Outsource may áo trụ. Đơn giá 4.500đ",
  },
  {
    id: "MAY_006", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Quần thể thao", kieuMay: "Bo gấu", mau: "Xanh navy", size: "M, L, XL, XXL",
    soLuongGiao: 1200, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-003", tenNguoiNhan: "Hương (May quần, ngoài)",
    ngayGiao: "2026-07-26", hanHoanThanh: "2026-08-05", donGia: 3500, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Outsource may quần bo gấu. Đơn giá 3.500đ",
  },
  // Khuy nút - NV017 (Ruộng)
  {
    id: "KN_005", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Bộ thể thao nam", kieuMay: "Bo gấu", mau: "Xanh navy", size: "M, L, XL, XXL",
    soLuongGiao: 1200, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV009", nguoiNhan: "NV017", tenNguoiNhan: "Nguyễn Văn Ruộng (Khuy nút)",
    ngayGiao: "2026-08-05", hanHoanThanh: "2026-08-08", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Đính nút áo + quần bộ thể thao. 750đ/cái",
  },
  // Gấp xếp - NV015 (Tím)
  {
    id: "DG_006", lenhSX: "LSX-2026-004", lenhCat: "LC-M222", maSP: "M222",
    phanLoai: "Bộ thể thao nam", kieuMay: "Bo gấu", mau: "Xanh navy", size: "M, L, XL, XXL",
    soLuongGiao: 1200, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV014", nguoiNhan: "NV015", tenNguoiNhan: "Tím (Gấp xếp)",
    ngayGiao: "2026-08-08", hanHoanThanh: "2026-08-10", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Gấp xếp bộ thể thao nam vào bao. 800đ/sp",
  },

  // ============ LSX-2026-005: M333 - Áo sơ mi nữ 600 áo ============
  // Cắt - NV006 (Giang)
  {
    id: "CAT_005", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", kieuMay: "Cổ vest", mau: "Hồng pastel", size: "S, M, L",
    soLuongGiao: 600, soLuongNhan: 600, soLuongDat: 600, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "NV006", tenNguoiNhan: "Nguyễn Hoàng Giang (Cắt)",
    ngayGiao: "2026-07-15", ngayNhan: "2026-07-15", ngayHoanThanh: "2026-07-18",
    hanHoanThanh: "2026-07-18",
    donGia: 1200, thanhTien: 600 * 1200, daThanhToan: 720000, conNo: 0,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Cắt áo sơ mi nữ. 1.200đ × 600 = 720K. Đạt 100%. Đã trả đủ",
  },
  // In/Thêu - Vui
  {
    id: "INTD_004", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", mau: "Hồng pastel", size: "S, M, L",
    viTriIn: "Thêu tên thương hiệu sau lưng",
    soLuongGiao: 600, soLuongNhan: 600, soLuongDat: 600, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV001", nguoiNhan: "DT-IN-005", tenNguoiNhan: "Vui (Thêu, ngoài)",
    ngayGiao: "2026-07-19", ngayNhan: "2026-07-19", ngayHoanThanh: "2026-07-23",
    hanHoanThanh: "2026-07-23", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Nguyễn Thị Ngọc Giàu",
    ghiChu: "Outsource thêu. Đạt 100%",
  },
  // May - Thanh (outsource)
  {
    id: "MAY_007", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", kieuMay: "Cổ vest", mau: "Hồng pastel", size: "S, M, L",
    soLuongGiao: 600, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-008", tenNguoiNhan: "Thanh (May áo sơ mi, ngoài)",
    ngayGiao: "2026-07-24", hanHoanThanh: "2026-08-03", donGia: 5500, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Outsource may áo sơ mi nữ. Đơn giá 5.500đ (cao vì cổ vest)",
  },
  // Khuy nút - NV018 (Khôi)
  {
    id: "KN_006", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", kieuMay: "Cổ vest", mau: "Hồng pastel", size: "S, M, L",
    soLuongGiao: 600, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV018", tenNguoiNhan: "Bùi Minh Khôi (Khuy nút)",
    ngayGiao: "2026-08-02", hanHoanThanh: "2026-08-05", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Đính nút áo sơ mi nữ + cúc cổ. 750đ/cái",
  },
  // Ủi - NV014 (Anh)
  {
    id: "UI_004", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", mau: "Hồng pastel", size: "S, M, L",
    soLuongGiao: 600, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV014", tenNguoiNhan: "Thế Anh (Ủi)",
    hanHoanThanh: "2026-08-04", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
  },
  // Gấp xếp - NV015 (Tím)
  {
    id: "DG_004", lenhSX: "LSX-2026-005", lenhCat: "LC-M333", maSP: "M333",
    phanLoai: "Áo sơ mi nữ", mau: "Hồng pastel", size: "S, M, L",
    soLuongGiao: 600, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV015", tenNguoiNhan: "Tím (Gấp xếp)",
    hanHoanThanh: "2026-08-05", donGia: 1000, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",
  },

  // ============ LSX-2026-006: M555 - Quần kaki 700 quần ============
  {
    id: "CAT_006", lenhSX: "LSX-2026-006", lenhCat: "LC-M555", maSP: "M555",
    phanLoai: "Quần kaki", kieuMay: "Ống đứng", mau: "Be", size: "M, L, XL",
    soLuongGiao: 700, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "NV007", tenNguoiNhan: "Phạm Văn Đệ (Cắt)",
    ngayGiao: "2026-07-27", hanHoanThanh: "2026-07-30", donGia: 900, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang làm", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Cắt quần kaki 900đ/cái. Dự kiến xong 30/7",
  },
  {
    id: "MAY_008", lenhSX: "LSX-2026-006", lenhCat: "LC-M555", maSP: "M555",
    phanLoai: "Quần kaki", kieuMay: "Ống đứng", mau: "Be", size: "M, L, XL",
    soLuongGiao: 700, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-007", tenNguoiNhan: "Thơ (May quần, ngoài)",
    ngayGiao: "2026-07-31", hanHoanThanh: "2026-08-08", donGia: 3800, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Outsource may quần kaki. 3.800đ",
  },
  {
    id: "KN_004", lenhSX: "LSX-2026-006", lenhCat: "LC-M555", maSP: "M555",
    phanLoai: "Quần kaki", mau: "Be", size: "M, L, XL",
    soLuongGiao: 700, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV017", tenNguoiNhan: "Nguyễn Văn Ruộng (Khuy nút)",
    hanHoanThanh: "2026-08-09", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
  },
  {
    id: "UI_005", lenhSX: "LSX-2026-006", lenhCat: "LC-M555", maSP: "M555",
    phanLoai: "Quần kaki", mau: "Be", size: "M, L, XL",
    soLuongGiao: 700, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV011", tenNguoiNhan: "Đặng Võ Công Tuyền (Ủi)",
    hanHoanThanh: "2026-08-10", donGia: 600, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",
    ghiChu: "Ủi quần 600đ",
  },
  {
    id: "DG_005", lenhSX: "LSX-2026-006", lenhCat: "LC-M555", maSP: "M555",
    phanLoai: "Quần kaki", mau: "Be", size: "M, L, XL",
    soLuongGiao: 700, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV005", nguoiNhan: "NV010", tenNguoiNhan: "Võ Thị Phương (Gấp xếp)",
    hanHoanThanh: "2026-08-11", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",
  },
];

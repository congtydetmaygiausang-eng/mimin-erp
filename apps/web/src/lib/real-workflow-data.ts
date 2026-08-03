// Data thật theo file Excel sếp Sang - 17 NV (GS001-GS017) - Imported 2026-08-03
// Bao gồm: 4 quản lý + 13 công nhân (cắt/ủi/gấp xếp/khuy nút/media)

import type { PhieuWorkflow } from "./workflow-data";
import { MORE_LSX } from "./more-workflow-data";

// ============ 17 NHÂN VIÊN THẬT (theo Excel) ============
export const REAL_NHAN_VIEN = [
  { ma: "NV007", ten: "Phạm Văn Đệ", boPhan: "cắt", donGia: 1400, ghiChu: "cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV009", ten: "NGUYỄN THỊ MỸ NHI", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV010", ten: "VÕ THỊ PHƯỜNG", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV004", ten: "NGUYỄN NGỌC CẨM VY", boPhan: "Content - Media", donGia: 0, ghiChu: "Content - Media - Lương CB: 8,000,000đ" },
  { ma: "NV003", ten: "ĐỖ THỊ HUYỀN", boPhan: "QL Khách hàng Sỉ", donGia: 0, ghiChu: "QL Khách hàng Sỉ - Lương CB: 7,000,000đ" },
  { ma: "NV002", ten: "BÙI THỊ THANH", boPhan: "Kế toán điều phối SX", donGia: 0, ghiChu: "Kế toán điều phối SX - Lương CB: 8,000,000đ" },
  { ma: "NV019", ten: "NGUYỄN THỊ BÉ", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV020", ten: "HUỲNH XUÂN HÒA", boPhan: "Media", donGia: 0, ghiChu: "Media - Lương CB: 10,000,000đ" },
  { ma: "NV021", ten: "NGUYỄN MINH ĐỨC", boPhan: "Ủi", donGia: 800, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV022", ten: "TRƯƠNG MINH TÂM", boPhan: "Ủi", donGia: 800, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV023", ten: "LÊ ĐỊNH", boPhan: "Ủi", donGia: 800, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV024", ten: "DƯƠNG TẤN VĨNH", boPhan: "Cắt", donGia: 1400, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV025", ten: "NGUYỄN QUỐC MINH", boPhan: "Cắt", donGia: 1400, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV026", ten: "TRƯƠNG VĂN NHẪN", boPhan: "Cắt", donGia: 1400, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV005", ten: "NGUYỄN QUỐC HẬU", boPhan: "Nhân viên Kho", donGia: 0, ghiChu: "Nhân viên Kho - Lương CB: 7,000,000đ" },
  { ma: "NV027", ten: "LƯƠNG HOÀNG PHI", boPhan: "Media", donGia: 0, ghiChu: "Media" },
  { ma: "NV017", ten: "NGUYỄN VĂN RUỘNG", boPhan: "Khuy nút", donGia: 750, ghiChu: "Khuy nút - Chung: 750đ" },
];

// ============ ĐƠN GIÁ THỰC TẾ ============
export const REAL_DON_GIA = {
  cat: {
    "áo trụ": 1400,
    "áo tròn": 1200,
    "quần": 900,
  },
  khuyNut: 750,
};

// ============ 12 PHIẾU WORKFLOW M758 + M873 ============

// Mapping theo bộ phận NV (KHÔNG dùng đối tác nữa)

export const REAL_PHIEU_M758: PhieuWorkflow[] = [

  // 1. CẮT - NV006 (Giang) - 500 bộ trụ trơn

  {

    id: "CAT_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Bộ trụ trơn", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 500, soLuongDat: 498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV002", nguoiNhan: "NV006", tenNguoiNhan: "Nguyễn Hoàng Giang (Cắt)",

    ngayGiao: "2026-07-20", ngayNhan: "2026-07-20", ngayHoanThanh: "2026-07-22",

    hanHoanThanh: "2026-07-22",

    donGia: 1400, thanhTien: 498 * 1400, daThanhToan: 0, conNo: 498 * 1400,

    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",

    ghiChu: "Cắt áo trụ 1.400đ × 498 = 697.200đ. Lỗi 2 bộ (dập lệch – sửa lại)",

  },

  // 2. IN THÊU DẬP - Outsource (chị Giàu tự quản lý)

  {

    id: "INTD_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Bộ trụ trơn", mau: "Trắng ngà", size: "L, XL, 2XL",

    viTriIn: "In logo + dập chữ",

    soLuongGiao: 500, soLuongNhan: 500, soLuongDat: 498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV001", nguoiNhan: "DT-IN-002", tenNguoiNhan: "Bảo Ngân (In – Dập, ngoài)",

    ngayGiao: "2026-07-22", ngayNhan: "2026-07-22", ngayHoanThanh: "2026-07-25",

    hanHoanThanh: "2026-07-25", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Nguyễn Thị Ngọc Giàu",

    ghiChu: "Outsource in/dập. Lỗi 2 cái dập lệch → Bảo Ngân sửa miễn phí",

  },

  // 3. MAY ÁO - NV007 (Đệ) - áo trụ

  {

    id: "MAY_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Áo trụ", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-011", tenNguoiNhan: "Liễu (May áo trụ, ngoài)",

    ngayGiao: "2026-07-26", hanHoanThanh: "2026-08-05", donGia: 4500, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",

    ghiChu: "Outsource may áo trụ. Đơn giá 4.500đ (theo file Excel a Cường)",

  },

  // 4. MAY QUẦN - Hương

  {

    id: "MAY_002", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Quần", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-003", tenNguoiNhan: "Hương (May quần, ngoài)",

    ngayGiao: "2026-07-26", hanHoanThanh: "2026-08-05", donGia: 3500, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",

    ghiChu: "Outsource may quần. Đơn giá 3.500đ",

  },

  // 5. KHUY NÚT - NV017 (Ruộng)

  {

    id: "KN_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Bộ trụ trơn", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV017", tenNguoiNhan: "Nguyễn Văn Ruộng (Khuy nút)",

    hanHoanThanh: "2026-08-06", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Đơn giá 750đ/cái (theo Lark chị Giàu). Chờ may xong",

  },

  // 6. ỦI ÁO - NV011 (Tuyền)

  {

    id: "UI_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Áo trụ", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV011", tenNguoiNhan: "Đặng Võ Công Tuyền (Ủi)",

    hanHoanThanh: "2026-08-07", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Ủi áo trụ. 4 NV ủi: Tuyền/Huynh/Thủy/Anh",

  },

  // 7. GẤP XẾP - NV009 (Mỹ Nhi)

  {

    id: "DG_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",

    phanLoai: "Bộ trắng", mau: "Trắng ngà", size: "L, XL, 2XL",

    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV009", tenNguoiNhan: "Nguyễn Thị Mỹ Nhi (Gấp xếp)",

    hanHoanThanh: "2026-08-08", donGia: 1500, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Gấp bộ trắng. 4 NV: Mỹ Nhi/Phương/Tím/Phiên",

  },

];



// ============ LSX-2026-002: M873 - Áo thun cotton 1,500 áo ============

export const REAL_PHIEU_M873: PhieuWorkflow[] = [

  // 1. CẮT - NV006 (Giang) - 1,500 áo thun

  {

    id: "CAT_002", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo thun cotton", kieuMay: "Trơn", mau: "Đen", size: "L, XL",

    soLuongGiao: 1500, soLuongNhan: 1500, soLuongDat: 1498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV002", nguoiNhan: "NV006", tenNguoiNhan: "Nguyễn Hoàng Giang (Cắt)",

    ngayGiao: "2026-07-22", ngayNhan: "2026-07-22", ngayHoanThanh: "2026-07-24",

    hanHoanThanh: "2026-07-24",

    donGia: 1200, thanhTien: 1498 * 1200, daThanhToan: 1797600, conNo: 0,

    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",

    ghiChu: "Cắt áo tròn 1.200đ × 1498 = 1.797.600đ. Lỗi 2 áo (vải xước). Đã trả đủ",

  },

  // 2. IN - Tiến Đạt

  {

    id: "INTD_002", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo thun cotton", mau: "Đen", size: "L, XL",

    viTriIn: "In lụa logo POLOMIMIN nhỏ",

    soLuongGiao: 1500, soLuongNhan: 1500, soLuongDat: 1498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV001", nguoiNhan: "DT-IN-001", tenNguoiNhan: "Tiến Đạt (In, ngoài)",

    ngayGiao: "2026-07-24", ngayNhan: "2026-07-24", ngayHoanThanh: "2026-07-30",

    hanHoanThanh: "2026-07-30", donGia: 0, thanhTien: 0, daThanhToan: 1000000, conNo: 0,

    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Nguyễn Thị Ngọc Giàu",

    ghiChu: "Outsource in lụa cotton đen. Tạm ứng 1tr (Bùi Thị Thanh duyệt)",

  },

  // 3. MAY - Cúc

  {

    id: "MAY_003", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo trụ", kieuMay: "Trơn", mau: "Đen", size: "L, XL",

    soLuongGiao: 1500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV002", nguoiNhan: "DT-MAY-010", tenNguoiNhan: "Cúc (May áo trụ, ngoài)",

    ngayGiao: "2026-07-26", hanHoanThanh: "2026-08-08", donGia: 4000, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",

    ghiChu: "Outsource may áo trụ. Đơn giá 4.000đ (theo file Excel a Cường)",

  },

  // 4. KHUY NÚT - NV017 (Ruộng)

  {

    id: "KN_002", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo thun", mau: "Đen", size: "L, XL",

    soLuongGiao: 1500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV017", tenNguoiNhan: "Nguyễn Văn Ruộng (Khuy nút)",

    hanHoanThanh: "2026-08-09", donGia: 750, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Đơn giá 750đ/cái. Chỉ đính nút + tag size",

  },

  // 5. ỦI - NV013 (Thủy)

  {

    id: "UI_002", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo tròn", mau: "Đen", size: "L, XL",

    soLuongGiao: 1500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV013", tenNguoiNhan: "Chu Quang Thủy (Ủi)",

    hanHoanThanh: "2026-08-10", donGia: 700, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ giao", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Ủi áo tròn 700đ. 4 NV ủi: Tuyền/Huynh/Thủy/Anh",

  },

  // 6. GẤP XẾP - NV010 (Phương)

  {

    id: "DG_002", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",

    phanLoai: "Áo thường", mau: "Đen", size: "L, XL",

    soLuongGiao: 1500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,

    nguoiGiao: "NV005", nguoiNhan: "NV010", tenNguoiNhan: "Võ Thị Phương (Gấp xếp)",

    hanHoanThanh: "2026-08-11", donGia: 800, thanhTien: 0, daThanhToan: 0, conNo: 0,

    trangThai: "Chờ gấp", mauDaDuyet: true, nguoiXacNhan: "",

    ghiChu: "Gấp áo thường 800đ. 4 NV: Mỹ Nhi/Phương/Tím/Phiên",

  },

];



// ============ TẤT CẢ PHIẾU ============

export const ALL_REAL_PHIEU: PhieuWorkflow[] = [

  ...REAL_PHIEU_M758,

  ...REAL_PHIEU_M873,

  ...MORE_LSX,

];



// ============ Helper: Tính sản lượng theo NV ============

export function tinhSanLuongTheoNguoi(phieus: PhieuWorkflow[]): { maNV: string; ten: string; boPhan: string; tongDat: number; tongTien: number }[] {

  const map: Record<string, { maNV: string; ten: string; boPhan: string; tongDat: number; tongTien: number }> = {};

  for (const p of phieus) {

    const key = p.nguoiNhan;

    if (!map[key]) {

      const nv = REAL_NHAN_VIEN.find((n) => n.ma === p.nguoiNhan);

      const isNV = !!nv;

      map[key] = {

        maNV: key,

        ten: p.tenNguoiNhan,

        boPhan: isNV ? nv.boPhan : "Outsource",

        tongDat: 0,

        tongTien: 0,

      };

    }

    map[key].tongDat += p.soLuongDat;

    map[key].tongTien += p.thanhTien;

  }

  return Object.values(map).sort((a, b) => b.tongTien - a.tongTien);

}

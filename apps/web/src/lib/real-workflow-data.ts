// Data thật theo file Excel sếp Sang - 17 NV (GS001-GS017) - Imported 2026-08-03
// Bao gồm: 4 quản lý + 13 công nhân (cắt/ủi/gấp xếp/khuy nút/media)
// Lưu ý: đã xoá dữ liệu mẫu 12 phiếu workflow (M758, M873) ngày 2026-08-03
//         để sếp Sang nhập mới từ đầu.

import type { PhieuWorkflow } from "./workflow-data";
import { MORE_LSX } from "./more-workflow-data";

// ============ 17 NHÂN VIÊN THẬT (theo Excel) ============
export const REAL_NHAN_VIEN = [
  { ma: "NV007", ten: "Phạm Văn Đệ", boPhan: "cắt", donGia: 1400, ghiChu: "cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV009", ten: "NGUYỄN THỊ MỸ NHI", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV010", ten: "VÕ THỊ PHƯƠNG", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV004", ten: "NGUYỄN NGỌC CẨM VY", boPhan: "Content - Media", donGia: 0, ghiChu: "Content - Media - Lương cứng 8.000.000đ" },
  { ma: "NV003", ten: "ĐỖ THỊ HUYỀN", boPhan: "QL Khách hàng Sỉ", donGia: 0, ghiChu: "QL Khách hàng Sỉ - Lương cứng 7.000.000đ" },
  { ma: "NV002", ten: "BÙI THỊ THANH", boPhan: "Kế toán điều phối SX", donGia: 0, ghiChu: "Kế toán điều phối SX - Lương cứng 8.000.000đ" },
  { ma: "NV019", ten: "NGUYỄN THỊ BÉ", boPhan: "Gấp xếp", donGia: 1300, ghiChu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ" },
  { ma: "NV020", ten: "HUỲNH XUÂN HÒA", boPhan: "Media", donGia: 0, ghiChu: "Media - Lương cứng 10.000.000đ" },
  { ma: "NV021", ten: "NGUYỄN MINH ĐỨC", boPhan: "Ủi", donGia: 700, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV022", ten: "TRƯƠNG MINH TÂM", boPhan: "Ủi", donGia: 700, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV023", ten: "LÊ ĐỊNH", boPhan: "Ủi", donGia: 700, ghiChu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ" },
  { ma: "NV024", ten: "DƯƠNG TẤN VĨNH", boPhan: "Cắt", donGia: 1200, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV025", ten: "NGUYỄN QUỐC MINH", boPhan: "Cắt", donGia: 1200, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV026", ten: "TRƯƠNG VĂN NHẪN", boPhan: "Cắt", donGia: 1200, ghiChu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ" },
  { ma: "NV005", ten: "NGUYỄN QUỐC HẬU", boPhan: "Nhân viên Kho", donGia: 0, ghiChu: "Nhân viên Kho - Lương cứng 7.000.000đ" },
  { ma: "NV027", ten: "LƯƠNG HOÀNG PHI", boPhan: "Media", donGia: 0, ghiChu: "Media - Lương cứng (chưa phân công)" },
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
  ui: {
    "áo trụ": 800,
    "áo tròn": 700,
    "quần": 600,
  },
  gapXep: {
    "bộ thường": 1300,
    "áo thường": 800,
    "bộ trắng": 1500,
    "áo trắng": 1000,
  },
};

// ============ PHIẾU WORKFLOW (đã xoá mẫu) ============
// Sếp Sang xoá 12 phiếu workflow mẫu (M758, M873) ngày 2026-08-03
// để nhập mới từ đầu.
export const REAL_PHIEU_M758: PhieuWorkflow[] = [];
export const REAL_PHIEU_M873: PhieuWorkflow[] = [];

// ============ TẤT CẢ PHIẾU ============
// (MORE_LSX đã rỗng từ 2026-08-03)
export const ALL_REAL_PHIEU: PhieuWorkflow[] = [
  ...REAL_PHIEU_M758,
  ...REAL_PHIEU_M873,
  ...MORE_LSX,
];

// ============ TÍNH SẢN LƯỢNG THEO NGƯỜI ============
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

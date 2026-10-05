// Data thật theo Supabase nhan_su - 5 nhân sự hiện tại
// Cập nhật: 2026-10-04 theo chỉ đạo của anh Cường

import type { PhieuWorkflow } from "./workflow-data";
import { MORE_LSX } from "./more-workflow-data";

// ============ 5 NHÂN VIÊN HIỆN TẠI (CHÍNH THỨC) ============
export const REAL_NHAN_VIEN = [
  { ma: "NV01", ten: "Hồ Minh Sang", boPhan: "Quản lý", donGia: 0, ghiChu: "Giám Đốc", luongCung: 25000000 },
  { ma: "NV02", ten: "Lê Định", boPhan: "Kho vận", donGia: 0, ghiChu: "Nhân viên Kho vận", luongCung: 8000000 },
  { ma: "NV03", ten: "Nguyễn Triết Khang", boPhan: "Sản xuất", donGia: 0, ghiChu: "Nhân viên Sản xuất", luongCung: 7000000 },
  { ma: "NV04", ten: "Lương Hoàng Phi", boPhan: "Quản lý", donGia: 0, ghiChu: "Quản Lý", luongCung: 12000000 },
  { ma: "NV05", ten: "Trần Lương Hùng", boPhan: "Kinh doanh", donGia: 0, ghiChu: "Trưởng Phòng KD", luongCung: 12000000 },
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

// ============ PHIẾU WORKFLOW ============
export const REAL_PHIEU_M758: PhieuWorkflow[] = [];
export const REAL_PHIEU_M873: PhieuWorkflow[] = [];

// ============ TẤT CẢ PHIẾU ============
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
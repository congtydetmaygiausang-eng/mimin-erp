#!/usr/bin/env python3
"""
Xoá dữ liệu mẫu trong MIMIN ERP - sếp Sang bắt đầu nhập mới.

XOÁ:
- REAL_PHIEU_M758, REAL_PHIEU_M873 (12 phiếu workflow test)
- MORE_LSX (4 LSX test bổ sung)
- DEFAULT_MAU_CONG_DOAN, DEFAULT_MAU_CHI_PHI (mẫu Áo Thun)
- File demo-users-19.ts (không ai dùng)
- File lark-mock.ts (không ai dùng)

GIỮ:
- 17 NV mới từ Excel (REAL_NHAN_VIEN)
- 20 đối tác gia công (DOI_TAC_GIA_CONG)
- 18 user (USERS)
- KHO_VAI, KHO_VAT_TU (kho - sếp tự quản lý)
- KH_SI_FULL, NCC_FULL (master data)
- REAL_DON_GIA (đơn giá thực tế)
"""
import os
import sys

REAL_WF = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\real-workflow-data.ts"
MORE_LSX = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\more-workflow-data.ts"
LENH_CAT = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\data\lenh-cat-store.tsx"
DEMO_USERS = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\demo-users-19.ts"
LARK_MOCK = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\lark-mock.ts"

def write(path, content):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.write(fd, content.encode("utf-8"))
    os.close(fd)
    print(f"[OK] {os.path.basename(path)}: {len(content)} bytes")

# ============ 1. real-workflow-data.ts: xoá REAL_PHIEU_M758, REAL_PHIEU_M873 ============
real_wf_content = '''// Data thật theo file Excel sếp Sang - 17 NV (GS001-GS017) - Imported 2026-08-03
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
'''
write(REAL_WF, real_wf_content)

# ============ 2. more-workflow-data.ts: xoá MORE_LSX ============
more_lsx_content = '''// File more-workflow-data.ts - đã xoá dữ liệu mẫu 4 LSX (M111, M222, M333, M555) ngày 2026-08-03
// Sếp Sang muốn bắt đầu nhập workflow từ đầu.

import type { PhieuWorkflow } from "./workflow-data";

// ============ LSX BỔ SUNG (đã xoá mẫu) ============
export const MORE_LSX: PhieuWorkflow[] = [];
'''
write(MORE_LSX, more_lsx_content)

# ============ 3. lenh-cat-store.tsx: xoá default mẫu ============
# Đọc file hiện tại
lenh_cat_content = open(LENH_CAT, "r", encoding="utf-8").read()

# Xoá DEFAULT_MAU_CONG_DOAN (set rỗng)
lenh_cat_content = lenh_cat_content.replace(
    "const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [\n  { id: \"AoThun\", ten: \"Áo Thun\", giaCong: [\n",
    "const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [\n"
)

# Tìm và xoá phần thân của DEFAULT_MAU_CONG_DOAN
import re
# Match toàn bộ DEFAULT_MAU_CONG_DOAN array (multi-line)
pattern_dcd = re.compile(
    r"const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem\[\] = \[.*?\];",
    re.DOTALL
)
lenh_cat_content = pattern_dcd.sub("const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [];", lenh_cat_content)

# Match toàn bộ DEFAULT_MAU_CHI_PHI array
pattern_dcp = re.compile(
    r"const DEFAULT_MAU_CHI_PHI: MauChiPhiItem\[\] = \[.*?\];",
    re.DOTALL
)
lenh_cat_content = pattern_dcp.sub("const DEFAULT_MAU_CHI_PHI: MauChiPhiItem[] = [];", lenh_cat_content)

# Sửa logic init: KHÔNG auto-load default nếu localStorage rỗng
# Tìm pattern: setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); -> bỏ
lenh_cat_content = lenh_cat_content.replace(
    "setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);\n          localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));",
    "// Đã xoá default: bắt đầu rỗng để sếp nhập mới"
)
lenh_cat_content = lenh_cat_content.replace(
    "setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);\n        }\n      } else {\n        setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);",
    "setDsMauCongDoan([]);\n        }\n      } else {\n        setDsMauCongDoan([]);"
)
lenh_cat_content = lenh_cat_content.replace(
    "setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);\n      }",
    "setDsMauCongDoan([]);\n      }"
)
lenh_cat_content = lenh_cat_content.replace(
    "setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));",
    "setDsMauChiPhi([]); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify([]));"
)
# Trong reset function
lenh_cat_content = lenh_cat_content.replace(
    "setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));\n    setDsMauChiPhi(DEFAULT_MAU_CHI_PHI); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify(DEFAULT_MAU_CHI_PHI));",
    "setDsMauCongDoan([]); localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify([]));\n    setDsMauChiPhi([]); localStorage.setItem(STORAGE_KEY_MCP, JSON.stringify([]));"
)

write(LENH_CAT, lenh_cat_content)

# ============ 4. Xoá 2 file không dùng ============
if os.path.exists(DEMO_USERS):
    os.remove(DEMO_USERS)
    print(f"[DEL] {os.path.basename(DEMO_USERS)}")
if os.path.exists(LARK_MOCK):
    os.remove(LARK_MOCK)
    print(f"[DEL] {os.path.basename(LARK_MOCK)}")

print("\n=== HOÀN THÀNH ===")
print("✅ REAL_PHIEU_M758/M873 = []")
print("✅ MORE_LSX = []")
print("✅ DEFAULT_MAU_CONG_DOAN/CHI_PHI = []")
print("✅ Init logic: KHONG auto-load default")
print("✅ Xoá demo-users-19.ts")
print("✅ Xoá lark-mock.ts")
print("\nGIỮ:")
print("- 17 NV mới (REAL_NHAN_VIEN)")
print("- 18 user (USERS)")
print("- 20 đối tác gia công (DOI_TAC_GIA_CONG)")
print("- Kho vải/phụ liệu (real-data.ts)")
print("- KH sỉ (master-data-full.ts)")
print("\n⚠️ Sếp Sang cần:")
print("1. Mở trình duyệt → F12 → Application → LocalStorage → Clear all")
print("2. Hoặc Ctrl+Shift+R để hard refresh")

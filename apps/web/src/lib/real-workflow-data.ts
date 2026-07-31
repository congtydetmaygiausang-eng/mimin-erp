// Data thật theo Lark chị Giàu - 17 NV thật + đơn giá thực tế
// Pulled from Lark Base NNKRbEQcYak0Ees0v61j2iXypEc on 2026-07-27

import type { PhieuWorkflow } from "./workflow-data";
import { MORE_LSX } from "./more-workflow-data";

// ============ 17 NHÂN VIÊN THẬT (NV001-NV018) ============
export const REAL_NHAN_VIEN = [
  { ma: "NV001", ten: "Nguyễn Thị Ngọc Giàu", boPhan: "Điều hành", donGia: 0, ghiChu: "Quản lý khách hàng, duyệt đơn, điều phối" },
  { ma: "NV002", ten: "Bùi Thị Thanh", boPhan: "Kế toán điều phối SX", donGia: 0, ghiChu: "Theo dõi LSX, giao–nhận, tiền gia công, công nợ" },
  { ma: "NV003", ten: "Đỗ Thị Huyền", boPhan: "Quản lý KH sỉ", donGia: 0, ghiChu: "Chăm sóc khách sỉ, báo giá, lên đơn, thu tiền" },
  { ma: "NV004", ten: "Nguyễn Ngọc Cẩm Vy", boPhan: "Content – Media", donGia: 0, ghiChu: "Chụp/quay, nội dung, đăng bài" },
  { ma: "NV005", ten: "Nguyễn Quốc Hậu", boPhan: "Kho", donGia: 0, ghiChu: "Nhận hàng, đếm, phân loại, nhập–xuất" },

  { ma: "NV006", ten: "Nguyễn Hoàng Giang", boPhan: "Cắt", donGia: 0, ghiChu: "Nhận lệnh cắt, kiểm vải, trải vải, cắt" },
  { ma: "NV007", ten: "Phạm Văn Đệ", boPhan: "Cắt", donGia: 0, ghiChu: "Trải/cắt, áo trụ 1.400đ, áo tròn 1.200đ, quần 900đ" },
  { ma: "NV008", ten: "Hồ Văn Minh Phú", boPhan: "Cắt", donGia: 0, ghiChu: "Hỗ trợ trải/cắt, đánh số, bó chi tiết" },

  { ma: "NV009", ten: "Nguyễn Thị Mỹ Nhi", boPhan: "Gấp xếp", donGia: 0, ghiChu: "Kiểm màu–size, gấp áo/bộ, bao, tem" },
  { ma: "NV010", ten: "Võ Thị Phương", boPhan: "Gấp xếp", donGia: 0, ghiChu: "Gấp, xếp, đóng bao, kiểm ri màu–size" },
  { ma: "NV015", ten: "Tím", boPhan: "Gấp xếp", donGia: 0, ghiChu: "Phân loại, gấp, bao, hỗ trợ đóng gói" },
  { ma: "NV016", ten: "Trần Thị Bé Phiên", boPhan: "Gấp xếp", donGia: 0, ghiChu: "Gấp, đóng bao, dán tem, kiểm mã–màu–size" },

  { ma: "NV011", ten: "Đặng Võ Công Tuyền", boPhan: "Ủi", donGia: 0, ghiChu: "Ủi đúng loại, giữ form, tách hàng lỗi" },
  { ma: "NV012", ten: "Phạm Văn Huynh", boPhan: "Ủi", donGia: 0, ghiChu: "Ủi áo/quần, kiểm bẩn–cháy–biến dạng" },
  { ma: "NV013", ten: "Chu Quang Thủy", boPhan: "Ủi", donGia: 0, ghiChu: "Ủi hoàn thiện cổ, tay, nẹp, lai" },
  { ma: "NV014", ten: "Thế Anh", boPhan: "Ủi", donGia: 0, ghiChu: "Ủi theo lô, đếm SL, chuyển gấp xếp" },

  { ma: "NV017", ten: "Nguyễn Văn Ruộng", boPhan: "Khuy nút", donGia: 750, ghiChu: "Làm khuy, đính nút, đơn giá 750đ/cái" },
  { ma: "NV018", ten: "Bùi Minh Khôi", boPhan: "Khuy nút", donGia: 750, ghiChu: "Hỗ trợ phân hàng" },
];

// ============ ĐƠN GIÁ THỰC TẾ (từ NV007 + NV017) ============
export const REAL_DON_GIA = {
  cat: {
    "áo trụ": 1400,
    "áo tròn": 1200,
    "quần": 900,
  },
  khuyNut: 750,  // 750đ/cái (NV017)
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

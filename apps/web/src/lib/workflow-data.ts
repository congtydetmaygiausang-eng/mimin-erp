// Workflow data - Mapping người thật + đơn giá theo Lark của chị Giàu
// Cập nhật v85: Import 35 đối tác thật từ lib/doi-tac-gia-cong.ts (CSV chị Giàu)

import { NGUOI_IN_THEU_DAP_NEW, NGUOI_MAY_NEW } from "./doi-tac-gia-cong";

export type Khau = "in-thêu-dập" | "may" | "khuy-nut" | "ui" | "dong-goi" | "cat";
export type TrangThaiPhieu =
  | "Chờ giao" | "Chờ gấp" | "Đã giao" | "Đang làm" | "Đang may" | "Đã nhận" | "Hoàn thành"
  | "Trễ hạn" | "Lỗi" | "Thiếu" | "Sửa lại" | "Đã thanh toán";

// ============ NGƯỜI THẬT THEO TỪNG KHAU ============

// 1. IN/THÊU/DẬP - 7 xưởng thật từ CSV chị Giàu (2026-07-28)
export const NGUOI_IN_THEU_DAP = NGUOI_IN_THEU_DAP_NEW;

// 2. MAY - 28 xưởng thật từ CSV chị Giàu (4 quần + 14 tròn + 10 trụ)
export const NGUOI_MAY = NGUOI_MAY_NEW;

// 3. KHUY NÚT - 1 nhân viên
export const NGUOI_KHUY_NUT = [
  { ma: "GS017", ten: "Nguyễn Văn Ruộng", sdt: "0909000001", donGia: 750, donVi: "cái", chuyenMon: "Làm khuy + đính nút" },
];

// 4. ỦI - 3 nhân viên
export const NGUOI_UI = [
  { ma: "GS009", ten: "Nguyễn Minh Đức", sdt: "365052474" },
  { ma: "GS011", ten: "Lê Định", sdt: "" },
  { ma: "GS010", ten: "Trương Minh Tâm", sdt: "343513417" },
];

// 5. GẤP XẾP/ĐÓNG GÓI - 3 nhân viên
export const NGUOI_DONG_GOI = [
  { ma: "GS002", ten: "Nguyễn Thị Mỹ Nhi", sdt: "901207771" },
  { ma: "GS003", ten: "Võ Thị Mỹ Phương", sdt: "702501456" },
  { ma: "GS007", ten: "Nguyễn Thị Bé", sdt: "363073998" },
];

// ============ ĐƠN GIÁ THỰC TẾ ============

export const DON_GIA = {
  // Khuy nút
  "khuy-nut": { giaTri: 750, donVi: "đ/cái" },

  // Ủi theo loại sản phẩm
  "ui-ao-tru": { giaTri: 800, donVi: "đ/cái" },
  "ui-ao-tron": { giaTri: 700, donVi: "đ/cái" },
  "ui-quan": { giaTri: 600, donVi: "đ/cái" },

  // Gấp xếp/Đóng gói theo phân loại
  "dong-goi-bo-thuong": { giaTri: 1300, donVi: "đ/bộ" },
  "dong-goi-ao-thuong": { giaTri: 800, donVi: "đ/cái" },
  "dong-goi-bo-trang": { giaTri: 1500, donVi: "đ/bộ" },
  "dong-goi-ao-trang": { giaTri: 1000, donVi: "đ/cái" },
};

// ============ PHÂN CÔNG WORKFLOW (5 khaaru) ============

export type PhieuWorkflow = {
  id: string;             // INTD_001, MAY_001, KN_001, UI_001, DG_001
  lenhSX: string;         // LSX-...
  lenhCat: string;        // LC-M758
  maSP: string;           // M758, M873
  phanLoai?: string;      // Bộ thường, áo thường, áo trụ, áo tròn, quần...
  mau?: string;
  size?: string;

  // 5 số lượng (Lark standard)
  soLuongGiao: number;    // Giao cho người nhận
  soLuongNhan: number;    // Số nhận về từ công đoạn trước
  soLuongDat: number;     // Số đạt yêu cầu
  soLuongLoi: number;     // Số lỗi
  soLuongThieu: number;   // Số thiếu (= giao - nhận)
  soLuongSua: number;     // Số phải sửa lại (cho May)

  // Người & thời gian
  nguoiGiao: string;      // Mã NV giao (bên ERP)
  nguoiNhan: string;      // Mã người nhận (NV hoặc đối tác)
  tenNguoiNhan: string;
  ngayGiao?: string;      // Ngày giao
  ngayNhan?: string;      // Ngày nhận về
  hanHoanThanh: string;   // Hạn hoàn thành
  ngayHoanThanh?: string; // Ngày làm xong

  // Tài chính
  donGia: number;
  thanhTien: number;      // = soLuongDat * donGia
  daThanhToan: number;
  conNo: number;          // = thanhTien - daThanhToan

  // Trạng thái
  trangThai: TrangThaiPhieu;

  // Meta
  viTriIn?: string;       // Cho In/T/D: ngực, tay, lưng...
  mauThucHien?: string;   // URL ảnh mẫu
  hinhAnhGiao?: string;   // URL ảnh giao nhận
  kieuMay?: string;       // Trơn, phối dây, phối lé...
  ghiChu?: string;
  mauDaDuyet?: boolean;   // Kiểm soát: đã có mẫu duyệt chưa
  nguoiXacNhan?: string;  // Kiểm soát: ai xác nhận nhận
  larkRecordId?: string;  // Lark Base record_id
};

// ============ DATA MẪU THEO TỪNG KHAU ============

// 0. CẮT - 2 phiếu mẫu
export const PHIEU_CAT: PhieuWorkflow[] = [
  {
    id: "CAT_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trụ trơn", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 500, soLuongDat: 498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "NV002", nguoiNhan: "NV006", tenNguoiNhan: "Nguyễn Hoàng Giang (Cắt)",
    ngayGiao: "2026-07-20", ngayNhan: "2026-07-20", ngayHoanThanh: "2026-07-22",
    hanHoanThanh: "2026-07-22",
    donGia: 1400, thanhTien: 498 * 1400, daThanhToan: 0, conNo: 498 * 1400,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Bùi Thị Thanh",
    ghiChu: "Cắt áo trụ 1.400đ × 498 = 697.200đ. Lỗi 2 bộ dập lệch",
  },
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
];

// 1. IN/THÊU/DẬP - 3 phiếu mẫu
export const PHIEU_IN_THEU_DAP: PhieuWorkflow[] = [
  {
    id: "INTD_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trụ trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    viTriIn: "In logo + dập chữ", soLuongGiao: 500, soLuongNhan: 500, soLuongDat: 498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS002", nguoiNhan: "DT-IN-002", tenNguoiNhan: "Bảo Ngân (In – Dập)",
    ngayGiao: "2026-07-22", ngayNhan: "2026-07-22", ngayHoanThanh: "2026-07-25",
    hanHoanThanh: "2026-07-25", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Mỹ Nhi",
    ghiChu: "Lỗi 2 cái do dập lệch, Bảo Ngân sửa miễn phí",
  },
  {
    id: "INTD_002", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trụ trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    viTriIn: "Thêu logo ngực", soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS002", nguoiNhan: "DT-IN-004", tenNguoiNhan: "Hạnh",
    ngayGiao: "2026-07-22", hanHoanThanh: "2026-07-28", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang làm", mauDaDuyet: true, nguoiXacNhan: "Mỹ Nhi",
  },
  {
    id: "INTD_003", lenhSX: "LSX-2026-002", lenhCat: "LC-M873", maSP: "M873",
    phanLoai: "Áo thun cotton", mau: "Đen", size: "L, XL",
    viTriIn: "In lụa cotton đen", soLuongGiao: 1500, soLuongNhan: 1500, soLuongDat: 1498, soLuongLoi: 2, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS002", nguoiNhan: "DT-IN-001", tenNguoiNhan: "Tiến Đạt (In)",
    ngayGiao: "2026-07-24", ngayNhan: "2026-07-24", ngayHoanThanh: "2026-07-30",
    hanHoanThanh: "2026-07-30", donGia: 0, thanhTien: 0, daThanhToan: 1000000, conNo: 0,
    trangThai: "Hoàn thành", mauDaDuyet: true, nguoiXacNhan: "Mỹ Nhi",
    ghiChu: "In logo nhỏ, tạm ứng 1tr",
  },
];

// 2. MAY - 2 phiếu mẫu
export const PHIEU_MAY: PhieuWorkflow[] = [
  {
    id: "MAY_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trụ trơn", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS003", nguoiNhan: "DT-MAY-011", tenNguoiNhan: "Liễu (May áo trụ)",
    ngayGiao: "2026-07-25", hanHoanThanh: "2026-08-05", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Mỹ Nhi",
  },
  {
    id: "MAY_002", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Quần", kieuMay: "Trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS003", nguoiNhan: "DT-MAY-003", tenNguoiNhan: "Hương (May quần)",
    ngayGiao: "2026-07-25", hanHoanThanh: "2026-08-05", donGia: 0, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Đang may", mauDaDuyet: true, nguoiXacNhan: "Mỹ Nhi",
  },
];

// 3. KHUY NÚT - 1 phiếu mẫu
export const PHIEU_KHUY_NUT: PhieuWorkflow[] = [
  {
    id: "KN_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trụ trơn", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS017", nguoiNhan: "GS017", tenNguoiNhan: "Nguyễn Văn Ruộng",
    hanHoanThanh: "2026-08-06", donGia: DON_GIA["khuy-nut"].giaTri, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: false, nguoiXacNhan: "",
  },
];

// 4. ỦI - 1 phiếu mẫu
export const PHIEU_UI: PhieuWorkflow[] = [
  {
    id: "UI_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Áo trụ", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS009", nguoiNhan: "GS009", tenNguoiNhan: "Đức / Định / Tâm",
    hanHoanThanh: "2026-08-07", donGia: DON_GIA["ui-ao-tru"].giaTri, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ giao", mauDaDuyet: false, nguoiXacNhan: "",
  },
];

// 5. GẤP XẾP/ĐÓNG GÓI - 1 phiếu mẫu
export const PHIEU_DONG_GOI: PhieuWorkflow[] = [
  {
    id: "DG_001", lenhSX: "LSX-2026-001", lenhCat: "LC-M758", maSP: "M758",
    phanLoai: "Bộ trắng", mau: "Trắng ngà", size: "L, XL, 2XL",
    soLuongGiao: 500, soLuongNhan: 0, soLuongDat: 0, soLuongLoi: 0, soLuongThieu: 0, soLuongSua: 0,
    nguoiGiao: "GS002", nguoiNhan: "GS002", tenNguoiNhan: "Mỹ Nhi / Phương / Bé",
    hanHoanThanh: "2026-08-08", donGia: DON_GIA["dong-goi-bo-trang"].giaTri, thanhTien: 0, daThanhToan: 0, conNo: 0,
    trangThai: "Chờ gấp", mauDaDuyet: false, nguoiXacNhan: "",
  },
];

// ============ HELPERS ============

export const KHAU_LABELS: Record<Khau, string> = {
  "cat": "Cắt",
  "in-thêu-dập": "In / Thêu / Dập",
  "may": "May",
  "khuy-nut": "Khuy nút",
  "ui": "Ủi",
  "dong-goi": "Gấp xếp / Đóng gói",
};

export const KHAU_ICONS: Record<Khau, string> = {
  "cat": "✂️",
  "in-thêu-dập": "🎨",
  "may": "🧵",
  "khuy-nut": "🔘",
  "ui": "🔥",
  "dong-goi": "📦",
};

export const TRANG_THAI_COLORS: Record<TrangThaiPhieu, string> = {
  "Chờ giao": "bg-slate-500/15 text-slate-700",
  "Đã giao": "bg-sky-500/15 text-sky-700",
  "Đang làm": "bg-amber-500/15 text-amber-700",
  "Đã nhận": "bg-violet-500/15 text-violet-700",
  "Đang may": "bg-amber-500/15 text-amber-700",
  "Chờ gấp": "bg-slate-500/15 text-slate-700",
  "Hoàn thành": "bg-emerald-500/15 text-emerald-700",
  "Đã thanh toán": "bg-emerald-500/15 text-emerald-700",
  "Trễ hạn": "bg-red-500/15 text-red-700",
  "Lỗi": "bg-red-500/15 text-red-700",
  "Thiếu": "bg-orange-500/15 text-orange-700",
  "Sửa lại": "bg-amber-500/15 text-amber-700",
};

export function tinhThanhTien(soLuongDat: number, donGia: number): number {
  return soLuongDat * donGia;
}

export function tinhConNo(thanhTien: number, daThanhToan: number): number {
  return thanhTien - daThanhToan;
}

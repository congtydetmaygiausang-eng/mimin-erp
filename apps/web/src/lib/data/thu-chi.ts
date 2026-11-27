// Dữ liệu Sổ Quỹ Thu Chi Nội Bộ (Chi phí vận hành, ăn uống, điện nước, vật dụng...)
// MIMIN ERP - Quản lý xưởng may

import * as XLSX from "xlsx";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";

export type LoaiThuChi = "chi" | "thu";

export type DanhMucThuChi =
  | "an_uong"
  | "dien_nuoc"
  | "mat_bang"
  | "vat_dung"
  | "sua_chua"
  | "van_chuyen"
  | "tiep_khach"
  | "tam_ung"
  | "phe_lieu"
  | "khac";

export type HinhThucThanhToan = "tien_mat" | "chuyen_khoan";

export type LoaiTamUng = "nhan_su" | "gia_cong";

export interface GiaoDichThuChi {
  id: string; // TC-YYYYMMDD-XXXX
  loai: LoaiThuChi;
  danhMuc: DanhMucThuChi;
  soTien: number;
  hinhThuc: HinhThucThanhToan;
  ngay: string; // YYYY-MM-DD
  nguoiThucHien: string; // Người chi hoặc thu tiền thực tế (VD: Anh Sang, Anh Cường, Chị Hoa...)
  nguoiNhan?: string; // Bên nhận tiền hoặc bên trả tiền
  noiDung: string; // Diễn giải chi tiết
  hinhAnh?: string[]; // Danh sách base64 hoặc URL ảnh bill, chứng từ

  // Phân loại nâng cao cho Tạm ứng (Nhân sự vs Xưởng gia công)
  loaiTamUng?: LoaiTamUng; // "nhan_su" (trừ vào Bảng Lương) hoặc "gia_cong" (trừ vào Công Nợ xưởng gia công)
  maDoiTac?: string; // Mã NV (NV01) hoặc Mã Đối tác gia công (GC-TRU-001)
  tenDoiTac?: string; // Tên nhân sự hoặc Tên xưởng gia công
  loaiGiaCong?: string; // Loại công đoạn gia công (May áo, May quần, In / Thêu...)
  maLenhCat?: string; // Mã lệnh cắt liên quan nếu có (VD: LC-M758)
  
  // Thông tin tài khoản người đăng nhập nhập phiếu vào hệ thống
  nguoiNhap?: string; // Tên hiển thị tài khoản lúc tạo (VD: Hồ Minh Sang)
  emailNguoiNhap?: string; // Email tài khoản đăng nhập (VD: sang@mimin.vn)
  roleNguoiNhap?: string; // Vai trò tài khoản lúc tạo (VD: admin, accountant...)
  
  ngayTao: string; // ISO string
}

/** Tự động nhận diện loại tạm ứng (nhân sự nội bộ vs bên gia công ngoài) */
export function nhanDienLoaiTamUng(item: {
  loaiTamUng?: LoaiTamUng;
  danhMuc?: DanhMucThuChi;
  nguoiNhan?: string;
  noiDung?: string;
  maDoiTac?: string;
}): LoaiTamUng {
  if (item.loaiTamUng === "gia_cong" || item.loaiTamUng === "nhan_su") return item.loaiTamUng;
  const s = `${item.maDoiTac || ""} ${item.nguoiNhan || ""} ${item.noiDung || ""}`.toUpperCase();
  if (
    s.includes("GC-") ||
    s.includes("XƯỞNG") ||
    s.includes("XUONG") ||
    s.includes("GIA CÔNG") ||
    s.includes("GIA CONG") ||
    s.includes("CHỊ LIỄU") ||
    s.includes("CHỊ HƯƠNG") ||
    s.includes("BẢO NGÂN") ||
    s.includes("THÊU") ||
    s.includes("MAY ÁO") ||
    s.includes("MAY QUẦN")
  ) {
    return "gia_cong";
  }
  return "nhan_su";
}

export interface DanhMucConfig {
  key: DanhMucThuChi;
  label: string;
  moTa: string;
  loaiMacDinh: LoaiThuChi;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const DANH_MUC_LIST: DanhMucConfig[] = [
  {
    key: "an_uong",
    label: "Cơm trưa & Nước uống",
    moTa: "Tiền cơm tổ may, tổ cắt, nước bình, trà đá, liên hoan",
    loaiMacDinh: "chi",
    color: "#f59e0b",
    badgeBg: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  {
    key: "dien_nuoc",
    label: "Điện, Nước & Net",
    moTa: "Tiền điện 3 pha xưởng may, nước sinh hoạt, wifi",
    loaiMacDinh: "chi",
    color: "#eab308",
    badgeBg: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    badgeText: "text-yellow-700 dark:text-yellow-400",
  },
  {
    key: "mat_bang",
    label: "Mặt bằng / Thuê xưởng",
    moTa: "Tiền thuê mặt bằng xưởng may, kho bãi",
    loaiMacDinh: "chi",
    color: "#6366f1",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
  {
    key: "vat_dung",
    label: "Vật dụng & Văn phòng phẩm",
    moTa: "Băng keo dán thùng, giấy in rập, phấn may, kim, kéo",
    loaiMacDinh: "chi",
    color: "#3b82f6",
    badgeBg: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-700 dark:text-blue-400",
  },
  {
    key: "sua_chua",
    label: "Sửa chữa & Bảo trì máy",
    moTa: "Bảo dưỡng máy may, máy vắt sổ, thay dao máy cắt, dầu máy",
    loaiMacDinh: "chi",
    color: "#f43f5e",
    badgeBg: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    badgeText: "text-rose-700 dark:text-rose-400",
  },
  {
    key: "van_chuyen",
    label: "Xăng xe & Vận chuyển ngoài",
    moTa: "Xăng xe đi giao mẫu, tiền Grab, cước ship phát sinh",
    loaiMacDinh: "chi",
    color: "#0ea5e9",
    badgeBg: "bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    badgeText: "text-sky-700 dark:text-sky-400",
  },
  {
    key: "tiep_khach",
    label: "Tiếp khách & Đối tác",
    moTa: "Cà phê gặp khách đặt may, cơm tiếp nhà cung cấp",
    loaiMacDinh: "chi",
    color: "#a855f7",
    badgeBg: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    badgeText: "text-purple-700 dark:text-purple-400",
  },
  {
    key: "tam_ung",
    label: "Tạm ứng / Hoàn ứng",
    moTa: "Tạm ứng đi mua đồ gấp hoặc hoàn ứng nội bộ",
    loaiMacDinh: "chi",
    color: "#14b8a6",
    badgeBg: "bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    badgeText: "text-teal-700 dark:text-teal-400",
  },
  {
    key: "phe_lieu",
    label: "Bán phế liệu / Vải vụn",
    moTa: "Thu tiền thanh lý vải vụn đầu tấm, bìa carton cũ, phế liệu xưởng",
    loaiMacDinh: "thu",
    color: "#10b981",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  {
    key: "khac",
    label: "Khoản khác",
    moTa: "Các khoản chi tiêu hoặc thu nhập đột xuất khác",
    loaiMacDinh: "chi",
    color: "#64748b",
    badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    badgeText: "text-slate-700 dark:text-slate-400",
  },
];

export const DANH_MUC_MAP = new Map<DanhMucThuChi, DanhMucConfig>(
  DANH_MUC_LIST.map((dm) => [dm.key, dm])
);

// Dữ liệu mẫu ban đầu thực tế cho nhà xưởng
export const MOCK_THU_CHI: GiaoDichThuChi[] = [
  // === CÁC KHOẢN TẠM ỨNG GIA CÔNG NGOÀI (Cấn trừ công nợ gia công) ===
  {
    id: "TC-20261119-005",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "gia_cong",
    maDoiTac: "GC-TRU-001",
    tenDoiTac: "NGUYỄN THỊ NGỌC LIỄU (Chị Liễu)",
    loaiGiaCong: "May áo trụ",
    maLenhCat: "LC-M758",
    soTien: 5500000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-11-19",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "GC-TRU-001 - NGUYỄN THỊ NGỌC LIỄU (Chị Liễu)",
    noiDung: "Tạm ứng đợt 1 tiền công may áo đơn hàng M758 (50% giá trị hợp đồng may áo)",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-11-19T10:15:00.000Z",
  },
  {
    id: "TC-20261116-004",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "gia_cong",
    maDoiTac: "GC-IN-002",
    tenDoiTac: "Xưởng in/thêu/dập Hạnh",
    loaiGiaCong: "In / Thêu / Dập",
    maLenhCat: "LC-M758",
    soTien: 1500000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-11-16",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "GC-IN-002 - Xưởng in/thêu/dập Hạnh",
    noiDung: "Tạm ứng tiền công thêu logo ngực cho đơn hàng LC-M758",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-11-16T15:20:00.000Z",
  },
  {
    id: "TC-20261112-005",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "gia_cong",
    maDoiTac: "GC-QUAN-004",
    tenDoiTac: "LÊ THỊ HOÀI HƯƠNG (Chị Hương)",
    loaiGiaCong: "May quần",
    maLenhCat: "LC-M758",
    soTien: 2000000,
    hinhThuc: "tien_mat",
    ngay: "2026-11-12",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "GC-QUAN-004 - LÊ THỊ HOÀI HƯƠNG (Chị Hương)",
    noiDung: "Tạm ứng tiền may quần đợt đầu xưởng Chị Hương",
    nguoiNhap: "Bùi Thị Thanh",
    emailNguoiNhap: "thanh@mimin.vn",
    roleNguoiNhap: "accountant",
    ngayTao: "2026-11-12T11:00:00.000Z",
  },
  // === CÁC KHOẢN TẠM ỨNG NHÂN SỰ NỘI BỘ (Khấu trừ Bảng Lương) ===
  {
    id: "TC-20261118-002",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "nhan_su",
    maDoiTac: "NV03",
    tenDoiTac: "Nguyễn Triết Khang",
    soTien: 1500000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-11-18",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "NV03 - Nguyễn Triết Khang",
    noiDung: "Tạm ứng chi phí sinh hoạt gia đình giữa tháng 11/2026",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-11-18T14:15:20.000Z",
  },
  {
    id: "TC-20261115-001",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "nhan_su",
    maDoiTac: "NV02",
    tenDoiTac: "Lê Định",
    soTien: 1000000,
    hinhThuc: "tien_mat",
    ngay: "2026-11-15",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "NV02 - Lê Định",
    noiDung: "Tạm ứng lương đợt 1 tháng 11/2026 cho nhân viên Kho vận",
    nguoiNhap: "Bùi Thị Thanh",
    emailNguoiNhap: "thanh@mimin.vn",
    roleNguoiNhap: "accountant",
    ngayTao: "2026-11-15T09:30:15.000Z",
  },
  {
    id: "TC-20261110-003",
    loai: "chi",
    danhMuc: "tam_ung",
    loaiTamUng: "nhan_su",
    maDoiTac: "NV07",
    tenDoiTac: "Trần Thái Hào",
    soTien: 500000,
    hinhThuc: "tien_mat",
    ngay: "2026-11-10",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "NV07 - Trần Thái Hào",
    noiDung: "Tạm ứng tiền xăng xe đi hỗ trợ kỹ thuật xưởng ngoài",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-11-10T10:05:45.000Z",
  },
  // Các khoản tạm ứng mẫu tháng 10/2026 (để kiểm tra xem tháng trước)
  {
    id: "TC-20261015-009",
    loai: "chi",
    danhMuc: "tam_ung",
    soTien: 1000000,
    hinhThuc: "tien_mat",
    ngay: "2026-10-15",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "NV02 - Lê Định",
    noiDung: "Tạm ứng lương đợt 1 tháng 10/2026",
    nguoiNhap: "Bùi Thị Thanh",
    emailNguoiNhap: "thanh@mimin.vn",
    roleNguoiNhap: "accountant",
    ngayTao: "2026-10-15T08:20:00.000Z",
  },
  {
    id: "TC-20261012-008",
    loai: "chi",
    danhMuc: "tam_ung",
    soTien: 1200000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-10-12",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "NV03 - Nguyễn Triết Khang",
    noiDung: "Tạm ứng tiền viện phí người nhà tháng 10/2026",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-10-12T11:45:00.000Z",
  },
  {
    id: "TC-20261004-001",
    loai: "chi",
    danhMuc: "an_uong",
    soTien: 680000,
    hinhThuc: "tien_mat",
    ngay: "2026-10-04",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "Quán cơm cô Ba",
    noiDung: "Cơm trưa tổ May + tổ Cắt (20 phần)",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-10-04T04:30:00.000Z",
  },
  {
    id: "TC-20261003-002",
    loai: "chi",
    danhMuc: "vat_dung",
    soTien: 340000,
    hinhThuc: "tien_mat",
    ngay: "2026-10-03",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "Văn phòng phẩm Tân Bình",
    noiDung: "Mua 6 cuộn băng keo dán thùng 5cm và 3 dao rọc giấy xưởng cắt",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-10-03T09:15:00.000Z",
  },
  {
    id: "TC-20261003-001",
    loai: "thu",
    danhMuc: "phe_lieu",
    soTien: 1250000,
    hinhThuc: "tien_mat",
    ngay: "2026-10-03",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "Ve chai thu mua vải",
    noiDung: "Bán 180kg vải vụn tổ cắt + 45kg thùng carton đóng gói cũ",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-10-03T08:00:00.000Z",
  },
  {
    id: "TC-20261002-001",
    loai: "chi",
    danhMuc: "sua_chua",
    soTien: 520000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-10-02",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "Thợ máy anh Hùng",
    noiDung: "Thay ổ chao máy 1 kim Juki bàn 2 + tra dầu bảo dưỡng máy vắt sổ",
    nguoiNhap: "Bùi Thị Thanh",
    emailNguoiNhap: "thanh@mimin.vn",
    roleNguoiNhap: "accountant",
    ngayTao: "2026-10-02T03:20:00.000Z",
  },
  {
    id: "TC-20261001-002",
    loai: "chi",
    danhMuc: "dien_nuoc",
    soTien: 4850000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-10-01",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "Điện lực EVN Hóc Môn",
    noiDung: "Tiền điện sản xuất 3 pha xưởng may tháng 09/2026",
    nguoiNhap: "Bùi Thị Thanh",
    emailNguoiNhap: "thanh@mimin.vn",
    roleNguoiNhap: "accountant",
    ngayTao: "2026-10-01T02:00:00.000Z",
  },
  {
    id: "TC-20261001-001",
    loai: "chi",
    danhMuc: "an_uong",
    soTien: 160000,
    hinhThuc: "tien_mat",
    ngay: "2026-10-01",
    nguoiThucHien: "Anh Sang",
    nguoiNhan: "Đại lý nước khoáng",
    noiDung: "Đổi 4 bình nước uống Lavie 19L cho xưởng",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-10-01T01:30:00.000Z",
  },
  {
    id: "TC-20260929-001",
    loai: "chi",
    danhMuc: "van_chuyen",
    soTien: 120000,
    hinhThuc: "tien_mat",
    ngay: "2026-09-29",
    nguoiThucHien: "Bảo (giao nhận)",
    nguoiNhan: "Cây xăng Petrolimex",
    noiDung: "Đổ xăng xe máy đi lấy mẫu bo cổ từ nhà dệt về duyệt gấp",
    nguoiNhap: "Quốc Hậu",
    emailNguoiNhap: "hau@mimin.vn",
    roleNguoiNhap: "warehouse",
    ngayTao: "2026-09-29T07:10:00.000Z",
  },
  {
    id: "TC-20260928-001",
    loai: "chi",
    danhMuc: "tiep_khach",
    soTien: 215000,
    hinhThuc: "chuyen_khoan",
    ngay: "2026-09-28",
    nguoiThucHien: "Anh Cường",
    nguoiNhan: "Highlands Coffee",
    noiDung: "Cà phê trao đổi mẫu áo mới với khách hàng sỉ",
    nguoiNhap: "Hồ Minh Sang",
    emailNguoiNhap: "sang@mimin.vn",
    roleNguoiNhap: "admin",
    ngayTao: "2026-09-28T09:40:00.000Z",
  },
];

const STORAGE_KEY = "mimin_thu_chi_noi_bo";
const DELETED_KEY = "mimin_thu_chi_deleted_ids";
const SUPABASE_TABLE = "thu_chi_noi_bo";

/** Quản lý danh sách ID phiếu đã xóa để ngăn Supabase sync lại */
function getDeletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...ids, id]));
    }
  } catch {}
}

function removeDeletedId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedIds().filter((x) => x !== id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
  } catch {}
}

/** Helper phân tích an toàn danh sách ảnh từ DB (tránh lỗi nếu DB trả về JSON string) */
function parseHinhAnh(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.filter((x) => typeof x === "string");
      if (raw.trim()) return [raw.trim()];
    } catch {
      if (raw.trim()) return [raw.trim()];
    }
  }
  return [];
}

/** Helper ánh xạ từ DB row (snake_case) sang GiaoDichThuChi (camelCase) */
function mapFromDbRow(row: any): GiaoDichThuChi {
  const rawLoaiTamUng = row.loai_tam_ung as LoaiTamUng | undefined;
  const detectedLoai =
    rawLoaiTamUng ||
    nhanDienLoaiTamUng({
      loaiTamUng: rawLoaiTamUng,
      danhMuc: row.danh_muc,
      nguoiNhan: row.nguoi_nhan,
      noiDung: row.noi_dung,
      maDoiTac: row.ma_doi_tac,
    });

  // Tự động nhận diện/trích xuất thông tin đối tác gia công nếu chưa có cột riêng
  let maDoiTac = row.ma_doi_tac || undefined;
  let tenDoiTac = row.ten_doi_tac || undefined;
  let loaiGiaCong = row.loai_gia_cong || undefined;
  let maLenhCat = row.ma_lenh_cat || undefined;
  let nguoiNhan = row.nguoi_nhan ? String(row.nguoi_nhan).trim() : "";
  const rawNoiDung = String(row.noi_dung || "");
  const fullText = `${nguoiNhan} ${rawNoiDung}`.trim();

  if (row.danh_muc === "tam_ung" && detectedLoai === "gia_cong") {
    if (!maDoiTac) {
      const matchMa = fullText.match(/\b(GC-[A-Z0-9-]+)\b/i);
      if (matchMa) maDoiTac = matchMa[1].toUpperCase();
    }
    if (!maLenhCat) {
      const matchLC = fullText.match(/\b(LC-[A-Z0-9-]+)\b/i);
      if (matchLC) maLenhCat = matchLC[1].toUpperCase();
    }
    if (!tenDoiTac) {
      if (nguoiNhan.includes(" - ")) {
        const parts = nguoiNhan.split(" - ");
        tenDoiTac = parts[parts.length - 1].trim();
      } else if (nguoiNhan) {
        tenDoiTac = nguoiNhan;
      }
    }
    if (!loaiGiaCong) {
      if (fullText.toLowerCase().includes("quần") || fullText.toLowerCase().includes("quan")) loaiGiaCong = "May quần";
      else if (fullText.toLowerCase().includes("áo") || fullText.toLowerCase().includes("ao")) loaiGiaCong = "May áo";
      else if (fullText.toLowerCase().includes("thêu") || fullText.toLowerCase().includes("theu") || fullText.toLowerCase().includes("in")) loaiGiaCong = "In / Thêu / Dập";
      else loaiGiaCong = "Gia công ngoài";
    }
  } else if (row.danh_muc === "tam_ung" && detectedLoai === "nhan_su") {
    // 1. Phân tích mã NV và tên từ nguoiNhan
    if (!maDoiTac && nguoiNhan) {
      const matchNV = nguoiNhan.match(/\b(NV-?\d+)\b/i);
      if (matchNV) maDoiTac = matchNV[1].toUpperCase();
    }
    if (!tenDoiTac && nguoiNhan) {
      if (nguoiNhan.includes(" - ")) {
        tenDoiTac = nguoiNhan.split(" - ")[1].trim();
      } else {
        tenDoiTac = nguoiNhan;
      }
    }

    // 2. Nhận diện thông minh từ nội dung nếu thông tin người nhận chưa có hoặc rỗng
    const ftLow = fullText.toLowerCase();
    // Loại bỏ các từ kế toán/hành chính dễ gây nhận diện sai tên người:
    // - "chi phí", "lệ phí", "học phí", "viện phí", "kinh phí", "phí ship" (tránh nhận nhầm Lương Hoàng Phi)
    // - "quản lý", "xử lý", "hợp lý", "đại lý" (tránh nhận nhầm Đoàn Văn Lý)
    // - "thu chi", "chi tiêu", "chi trả", "chi lương", "chi tạm ứng" (tránh nhận nhầm Lục Thị Kim Chi)
    const ftClean = ftLow
      .replace(/(chi|học|lệ|viện|kinh|cước)\s+phí|phí\s+(ship|xe|vận\s+chuyển|phát\s+sinh|khác)/g, " ")
      .replace(/quản\s+lý|xử\s+lý|hợp\s+lý|đại\s+lý/g, " ")
      .replace(/thu\s+chi|chi\s+tiêu|chi\s+trả|chi\s+lương|chi\s+tạm\s+ứng/g, " ");

    if (!maDoiTac || !tenDoiTac || !nguoiNhan || nguoiNhan === "null" || nguoiNhan === "Chưa xác định") {
      if (ftLow.includes("nano")) {
        maDoiTac = maDoiTac || "NANO";
        tenDoiTac = tenDoiTac || "Nano";
        nguoiNhan = nguoiNhan || "Nano";
      } else if (/\b(nv-?07|trần thái hào|thái hào)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(hào|anh\s+hào|em\s+hào)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV07";
        tenDoiTac = tenDoiTac || "Trần Thái Hào";
        nguoiNhan = nguoiNhan || "NV07 - Trần Thái Hào";
      } else if (/\b(nv-?015|đoàn văn lý|văn lý)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(anh\s+lý|chú\s+lý)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV-015";
        tenDoiTac = tenDoiTac || "Đoàn Văn Lý";
        nguoiNhan = nguoiNhan || "NV-015 - Đoàn Văn Lý";
      } else if (/\b(nv-?08|nguyễn hoàng giang|hoàng giang)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(giang|anh\s+giang)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV08";
        tenDoiTac = tenDoiTac || "Nguyễn Hoàng Giang";
        nguoiNhan = nguoiNhan || "NV08 - Nguyễn Hoàng Giang";
      } else if (/\b(nv-?05|trần lương hùng|lương hùng)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(anh\s+hùng|chú\s+hùng)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV05";
        tenDoiTac = tenDoiTac || "Trần Lương Hùng";
        nguoiNhan = nguoiNhan || "NV05 - Trần Lương Hùng";
      } else if (/\b(nv-?03|nguyễn triết khang|triết khang)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(khang|anh\s+khang)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV03";
        tenDoiTac = tenDoiTac || "Nguyễn Triết Khang";
        nguoiNhan = nguoiNhan || "NV03 - Nguyễn Triết Khang";
      } else if (/\b(nv-?02|lê định|định kho)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(định|anh\s+định)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV02";
        tenDoiTac = tenDoiTac || "Lê Định";
        nguoiNhan = nguoiNhan || "NV02 - Lê Định";
      } else if (/\b(nv-?04|lương hoàng phi|hoàng phi)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(anh\s+phi|em\s+phi|phi\s+ứng)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV04";
        tenDoiTac = tenDoiTac || "Lương Hoàng Phi";
        nguoiNhan = nguoiNhan || "NV04 - Lương Hoàng Phi";
      } else if (/\b(nv-?01|hồ minh sang|anh sang)\b/i.test(ftLow)) {
        maDoiTac = maDoiTac || "NV01";
        tenDoiTac = tenDoiTac || "Hồ Minh Sang";
        nguoiNhan = nguoiNhan || "NV01 - Hồ Minh Sang";
      } else if (/\b(nv-?09|lê tuấn thành|tuấn thành)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(thành|anh\s+thành)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV09";
        tenDoiTac = tenDoiTac || "Lê Tuấn Thành";
        nguoiNhan = nguoiNhan || "NV09 - Lê Tuấn Thành";
      } else if (/\b(nv-?10|trần hoàng lâm|hoàng lâm)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(lâm|anh\s+lâm)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV10";
        tenDoiTac = tenDoiTac || "Trần Hoàng Lâm";
        nguoiNhan = nguoiNhan || "NV10 - Trần Hoàng Lâm";
      } else if (/\b(nv-?011|lục thị kim chi|kim chi)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(chị\s+chi|em\s+chi|cô\s+chi)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV-011";
        tenDoiTac = tenDoiTac || "Lục Thị Kim Chi";
        nguoiNhan = nguoiNhan || "NV-011 - Lục Thị Kim Chi";
      } else if (/\b(nv-?012|hồ lê khánh duy|khánh duy)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(duy|anh\s+duy)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV-012";
        tenDoiTac = tenDoiTac || "Hồ Lê Khánh Duy";
        nguoiNhan = nguoiNhan || "NV-012 - Hồ Lê Khánh Duy";
      } else if (/\b(nv-?013|dương tuyết nhung|tuyết nhung)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(nhung|chị\s+nhung|em\s+nhung)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV-013";
        tenDoiTac = tenDoiTac || "Dương Tuyết Nhung";
        nguoiNhan = nguoiNhan || "NV-013 - Dương Tuyết Nhung";
      } else if (/\b(nv-?014|nguyễn tuấn tú|tuấn tú)\b/i.test(ftLow) || /(^|[^\wÀ-ỹ])(tú|anh\s+tú)([^\wÀ-ỹ]|$)/i.test(ftClean)) {
        maDoiTac = maDoiTac || "NV-014";
        tenDoiTac = tenDoiTac || "Nguyễn Tuấn Tú";
        nguoiNhan = nguoiNhan || "NV-014 - Nguyễn Tuấn Tú";
      }
    }
  }

  return {
    id: row.id,
    loai: row.loai,
    danhMuc: row.danh_muc,
    soTien: Number(row.so_tien) || 0,
    hinhThuc: row.hinh_thuc,
    ngay: row.ngay,
    nguoiThucHien: row.nguoi_thuc_hien,
    nguoiNhan: nguoiNhan || row.nguoi_nhan || undefined,
    noiDung: row.noi_dung,
    hinhAnh: parseHinhAnh(row.hinh_anh),
    loaiTamUng: row.danh_muc === "tam_ung" ? detectedLoai : undefined,
    maDoiTac,
    tenDoiTac,
    loaiGiaCong,
    maLenhCat,
    nguoiNhap: row.nguoi_nhap || undefined,
    emailNguoiNhap: row.email_nguoi_nhap || undefined,
    roleNguoiNhap: row.role_nguoi_nhap || undefined,
    ngayTao: row.ngay_tao || row.created_at || new Date().toISOString(),
  };
}

/** Helper ánh xạ từ GiaoDichThuChi sang DB row (chỉ gửi các cột có thật trong DB Supabase) */
function mapToDbRow(item: GiaoDichThuChi): Record<string, any> {
  return {
    id: item.id,
    loai: item.loai,
    danh_muc: item.danhMuc,
    so_tien: item.soTien,
    hinh_thuc: item.hinhThuc,
    ngay: item.ngay,
    nguoi_thuc_hien: item.nguoiThucHien,
    nguoi_nhan: item.nguoiNhan || null,
    noi_dung: item.noiDung,
    hinh_anh: item.hinhAnh || [],
    nguoi_nhap: item.nguoiNhap || null,
    email_nguoi_nhap: item.emailNguoiNhap || null,
    role_nguoi_nhap: item.roleNguoiNhap || null,
    ngay_tao: item.ngayTao,
    updated_at: new Date().toISOString(),
  };
}

/** Lấy danh sách giao dịch từ localStorage (hoặc nạp mock nếu chưa từng tạo) */
export function getDanhSachThuChi(): GiaoDichThuChi[] {
  if (typeof window === "undefined") return MOCK_THU_CHI;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Chỉ nạp MOCK_THU_CHI lần đầu tiên khi chưa có key trong storage
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_THU_CHI));
      return MOCK_THU_CHI;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deleted = new Set(getDeletedIds());
      return parsed.filter((x) => !deleted.has(x.id));
    }
    return [];
  } catch (err) {
    console.warn("Lỗi đọc danh sách thu chi từ localStorage:", err);
    return MOCK_THU_CHI;
  }
}

/** Lưu toàn bộ danh sách giao dịch vào localStorage (có bảo vệ chống tràn Quota) */
export function luuDanhSachThuChi(danhSach: GiaoDichThuChi[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(danhSach));
    // Phát sự kiện để Bảng Lương và các module khác đồng bộ realtime
    window.dispatchEvent(new CustomEvent("mimin_thu_chi_updated", { detail: { count: danhSach.length } }));
  } catch (err: any) {
    console.error("Lỗi ghi danh sách thu chi vào localStorage:", err);
    // Nếu gặp QuotaExceededError, tự động dọn dẹp các tệp ảnh quá cũ để lưu được
    if (err?.name === "QuotaExceededError" || err?.code === 22) {
      try {
        const pruned = danhSach.map((item, index) => {
          if (index >= 15 && item.hinhAnh && item.hinhAnh.length > 0) {
            // Với các phiếu cũ hơn 15 giao dịch, rút gọn bớt ảnh phụ
            return { ...item, hinhAnh: [item.hinhAnh[0]] };
          }
          return item;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        window.dispatchEvent(new CustomEvent("mimin_thu_chi_updated", { detail: { count: pruned.length } }));
      } catch (retryErr) {
        console.warn("Không thể lưu localStorage cả sau khi prune ảnh:", retryErr);
      }
    }
  }
}

/** Tải dữ liệu từ Supabase và merge hai chiều vào localStorage */
export async function syncFromSupabase(): Promise<{ data: GiaoDichThuChi[]; error?: string }> {
  const localData = getDanhSachThuChi();
  if (!isSupabaseEnabled || !supabase) return { data: localData };

  const deletedIds = getDeletedIds();

  try {
    // 1. Nếu có ID đã xoá cục bộ, dọn dẹp trên Supabase
    if (deletedIds.length > 0) {
      void supabase.from(SUPABASE_TABLE).delete().in("id", deletedIds);
    }

    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("*")
      .order("ngay", { ascending: false });

    if (error) {
      console.warn(`[Supabase] Chưa đồng bộ được bảng ${SUPABASE_TABLE}:`, error.message);
      return { data: localData, error: error.message };
    }

    if (Array.isArray(data) && data.length > 0) {
      const deletedSet = new Set(deletedIds);
      const remoteMapped = data
        .map(mapFromDbRow)
        .filter((x) => !deletedSet.has(x.id));

      // Hợp nhất dữ liệu: lấy remote + bổ sung các phiếu local mới tạo chưa kịp đẩy
      const remoteIdSet = new Set(remoteMapped.map((x) => x.id));
      const localOnly = localData.filter((x) => !remoteIdSet.has(x.id) && !deletedSet.has(x.id));
      
      const merged = [...localOnly, ...remoteMapped].sort((a, b) => b.ngay.localeCompare(a.ngay));
      luuDanhSachThuChi(merged);

      // Nếu có phiếu local chưa có trên remote, tự động sync lên
      if (localOnly.length > 0) {
        void syncAllToSupabase(localOnly);
      }

      return { data: merged };
    }

    // Nếu bảng trên Supabase rỗng mà local có dữ liệu, tự động đẩy dữ liệu mẫu lên Supabase
    if (Array.isArray(data) && data.length === 0 && localData.length > 0) {
      void syncAllToSupabase(localData);
    }

    return { data: localData };
  } catch (err: any) {
    console.warn("[Supabase] Lỗi kết nối Supabase:", err);
    return { data: localData, error: err?.message || "Lỗi kết nối Supabase" };
  }
}

/** Đẩy toàn bộ danh sách lên Supabase (phục vụ seed ban đầu hoặc backup) */
export async function syncAllToSupabase(ds: GiaoDichThuChi[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseEnabled || !supabase || ds.length === 0) return { success: true };
  try {
    const rows = ds.map(mapToDbRow);
    const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: "id" });
    if (error) {
      console.warn(`[Supabase] Lỗi đẩy toàn bộ lên ${SUPABASE_TABLE}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("[Supabase] Lỗi syncAllToSupabase:", err);
    return { success: false, error: err?.message || "Lỗi mạng" };
  }
}

/** Thêm giao dịch mới (Lưu localStorage + đẩy trực tiếp lên Supabase) */
export async function themGiaoDich(
  item: Omit<GiaoDichThuChi, "id" | "ngayTao">
): Promise<{ item: GiaoDichThuChi; supabaseError?: string }> {
  const ds = getDanhSachThuChi();
  const dateStr = item.ngay.replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newId = `TC-${dateStr}-${randomSuffix}`;

  const moi: GiaoDichThuChi = {
    ...item,
    id: newId,
    ngayTao: new Date().toISOString(),
  };

  const capNhat = [moi, ...ds];
  luuDanhSachThuChi(capNhat);

  let supabaseError: string | undefined;

  // Đẩy lên Supabase
  if (isSupabaseEnabled && supabase) {
    try {
      const payload = mapToDbRow(moi);
      const { error } = await supabase.from(SUPABASE_TABLE).upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn(`[Supabase] Không thể lưu phiếu ${newId} lên Supabase:`, error.message);
        supabaseError = error.message;
      }
    } catch (err: any) {
      console.warn("[Supabase] Lỗi đẩy phiếu mới lên Supabase:", err);
      supabaseError = err?.message || "Lỗi mạng";
    }
  }

  return { item: moi, supabaseError };
}

/** Cập nhật giao dịch (An toàn tuyệt đối: tự động hợp nhất hoặc thêm mới nếu chưa có trong bộ nhớ tạm) */
export async function capNhatGiaoDich(
  id: string,
  updates: Partial<GiaoDichThuChi>
): Promise<{ item: GiaoDichThuChi; supabaseError?: string }> {
  let ds = getDanhSachThuChi();
  const idx = ds.findIndex((x) => x.id === id);

  let updated: GiaoDichThuChi;
  if (idx !== -1) {
    updated = { ...ds[idx], ...updates, id };
    ds[idx] = updated;
  } else {
    // Nếu trong localStorage chưa có (hoặc client mở modal sửa trước khi local cache sync xong)
    // Tự động khởi tạo bản ghi đầy đủ từ updates và chèn vào đầu danh sách, không bao giờ báo lỗi
    updated = {
      id,
      loai: updates.loai || "chi",
      danhMuc: updates.danhMuc || "tam_ung",
      soTien: typeof updates.soTien === "number" ? updates.soTien : 0,
      hinhThuc: updates.hinhThuc || "tien_mat",
      ngay: updates.ngay || new Date().toISOString().slice(0, 10),
      nguoiThucHien: updates.nguoiThucHien || "Thủ quỹ",
      nguoiNhan: updates.nguoiNhan || undefined,
      noiDung: updates.noiDung || "",
      hinhAnh: updates.hinhAnh || [],
      loaiTamUng: updates.loaiTamUng,
      maDoiTac: updates.maDoiTac,
      tenDoiTac: updates.tenDoiTac,
      loaiGiaCong: updates.loaiGiaCong,
      maLenhCat: updates.maLenhCat,
      nguoiNhap: updates.nguoiNhap,
      emailNguoiNhap: updates.emailNguoiNhap,
      roleNguoiNhap: updates.roleNguoiNhap,
      ngayTao: updates.ngayTao || new Date().toISOString(),
      ...updates,
    };
    ds = [updated, ...ds];
  }

  luuDanhSachThuChi(ds);
  removeDeletedId(id);

  let supabaseError: string | undefined;

  // Cập nhật trực tiếp lên Supabase
  if (isSupabaseEnabled && supabase) {
    try {
      const payload = mapToDbRow(updated);
      const { error } = await supabase.from(SUPABASE_TABLE).upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn(`[Supabase] Không thể cập nhật phiếu ${id} lên Supabase:`, error.message);
        supabaseError = error.message;
      }
    } catch (err: any) {
      console.warn("[Supabase] Lỗi cập nhật lên Supabase:", err);
      supabaseError = err?.message || "Lỗi mạng";
    }
  }

  return { item: updated, supabaseError };
}

/** Xoá giao dịch (Đồng bộ cả localStorage và Supabase) */
export async function xoaGiaoDich(id: string): Promise<{ success: boolean; supabaseError?: string }> {
  const ds = getDanhSachThuChi();
  const filtered = ds.filter((x) => x.id !== id);
  
  // 1. Lưu lại vào localStorage
  luuDanhSachThuChi(filtered);
  // 2. Ghi nhận ID đã xóa để chống Supabase sync kéo lại
  addDeletedId(id);

  let supabaseError: string | undefined;

  // 3. Xoá trên Supabase (kể cả khi id không có trong local storage)
  if (isSupabaseEnabled && supabase) {
    try {
      const { error } = await supabase.from(SUPABASE_TABLE).delete().eq("id", id);
      if (error) {
        console.warn(`[Supabase] Không thể xoá phiếu ${id} trên Supabase:`, error.message);
        supabaseError = error.message;
      } else {
        removeDeletedId(id);
      }
    } catch (err: any) {
      console.warn("[Supabase] Lỗi xoá trên Supabase:", err);
      supabaseError = err?.message || "Lỗi mạng";
    }
  }

  return { success: true, supabaseError };
}

/** Tính tổng số tiền thu */
export function tinhTongThu(ds: GiaoDichThuChi[]): number {
  return ds
    .filter((x) => x.loai === "thu")
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** 
 * Tính tổng số tiền chi vận hành xưởng
 * Lưu ý: Mặc định KHÔNG bao gồm các khoản Tạm Ứng (Nhân sự và Bên gia công)
 * Vì Tạm ứng nhân sự sẽ trừ vào Bảng Lương, còn Tạm ứng gia công sẽ cấn trừ vào Công nợ gia công.
 */
export function tinhTongChi(ds: GiaoDichThuChi[], includeTamUng = false): number {
  return ds
    .filter((x) => x.loai === "chi" && (includeTamUng || x.danhMuc !== "tam_ung"))
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** Tính tổng số tiền tạm ứng cho nhân sự nội bộ (để đối soát khấu trừ Bảng Lương) */
export function tinhTongTamUngNhanSu(ds: GiaoDichThuChi[]): number {
  return ds
    .filter((x) => x.loai === "chi" && x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "nhan_su")
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** Tính tổng số tiền tạm ứng cho bên gia công (để đối soát cấn trừ Công Nợ gia công ngoài) */
export function tinhTongTamUngGiaCong(ds: GiaoDichThuChi[]): number {
  return ds
    .filter((x) => x.loai === "chi" && x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "gia_cong")
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** Tính tổng số tiền tạm ứng (cả nhân sự + xưởng gia công) */
export function tinhTongTamUng(ds: GiaoDichThuChi[]): number {
  return ds
    .filter((x) => x.loai === "chi" && x.danhMuc === "tam_ung")
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** Thống kê chi tiết tiền tạm ứng theo từng xưởng gia công */
export function thongKeTamUngTheoXuongGiaCong(ds: GiaoDichThuChi[]): {
  maDoiTac: string;
  tenXuong: string;
  loaiGiaCong: string;
  tongUng: number;
  soLanUng: number;
  ngayGanNhat: string;
}[] {
  const list = ds.filter(
    (x) => x.loai === "chi" && x.danhMuc === "tam_ung" && nhanDienLoaiTamUng(x) === "gia_cong"
  );
  const map = new Map<
    string,
    {
      maDoiTac: string;
      tenXuong: string;
      loaiGiaCong: string;
      tongUng: number;
      soLanUng: number;
      ngayGanNhat: string;
    }
  >();

  for (const item of list) {
    const key = item.maDoiTac || item.nguoiNhan || "Xưởng khác";
    const existing = map.get(key);
    const ngay = item.ngay || "";
    if (!existing) {
      map.set(key, {
        maDoiTac: item.maDoiTac || "",
        tenXuong: item.tenDoiTac || item.nguoiNhan || key,
        loaiGiaCong: item.loaiGiaCong || "Gia công ngoài",
        tongUng: Number(item.soTien) || 0,
        soLanUng: 1,
        ngayGanNhat: ngay,
      });
    } else {
      existing.tongUng += Number(item.soTien) || 0;
      existing.soLanUng += 1;
      if (ngay > existing.ngayGanNhat) existing.ngayGanNhat = ngay;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.tongUng - a.tongUng);
}

/** Tính số dư chênh lệch thu - chi vận hành (tồn quỹ) */
export function tinhTonQuy(ds: GiaoDichThuChi[]): number {
  return tinhTongThu(ds) - tinhTongChi(ds, false);
}

/** Thống kê chi tiết theo từng danh mục (Mặc định không tính Tạm Ứng vào chi phí vận hành) */
export function thongKeTheoDanhMuc(
  ds: GiaoDichThuChi[],
  loai: LoaiThuChi,
  includeTamUng = false
): { danhMuc: DanhMucThuChi; label: string; tongTien: number; tyLe: number; soGiaoDich: number }[] {
  const filtered = ds.filter((x) => x.loai === loai && (includeTamUng || x.danhMuc !== "tam_ung"));
  const tong = filtered.reduce((s, x) => s + (Number(x.soTien) || 0), 0);

  const group: Partial<Record<DanhMucThuChi, { tongTien: number; count: number }>> = {};

  filtered.forEach((x) => {
    if (!group[x.danhMuc]) {
      group[x.danhMuc] = { tongTien: 0, count: 0 };
    }
    group[x.danhMuc]!.tongTien += Number(x.soTien) || 0;
    group[x.danhMuc]!.count += 1;
  });

  return Object.entries(group)
    .map(([key, val]) => {
      const dmKey = key as DanhMucThuChi;
      const config = DANH_MUC_MAP.get(dmKey);
      return {
        danhMuc: dmKey,
        label: config?.label || dmKey,
        tongTien: val!.tongTien,
        tyLe: tong > 0 ? (val!.tongTien / tong) * 100 : 0,
        soGiaoDich: val!.count,
      };
    })
    .sort((a, b) => b.tongTien - a.tongTien);
}

/** Xuất danh sách Thu Chi ra file Excel (.xlsx) */
export function xuatExcelThuChi(ds: GiaoDichThuChi[], tenFile = "ThuChiNoiBo_MIMIN"): void {
  const dataExport = ds.map((item, index) => {
    const dmConfig = DANH_MUC_MAP.get(item.danhMuc);
    const loaiTamUng =
      item.danhMuc === "tam_ung"
        ? nhanDienLoaiTamUng(item) === "gia_cong"
          ? "Tạm ứng Bên Gia Công (Khấu trừ công nợ)"
          : "Tạm ứng Nhân Sự (Khấu trừ bảng lương)"
        : "";

    return {
      STT: index + 1,
      "Mã GD": item.id,
      "Ngày": item.ngay,
      "Loại": item.loai === "thu" ? "Thu tiền (+)" : "Chi tiền (-)",
      "Danh mục": dmConfig?.label || item.danhMuc,
      "Phân loại Tạm ứng": loaiTamUng,
      "Đối tác / Xưởng / NV nhận": item.tenDoiTac || item.nguoiNhan || "",
      "Mã Đối tác / NV": item.maDoiTac || "",
      "Công đoạn gia công": item.loaiGiaCong || "",
      "Mã Lệnh Cắt liên quan": item.maLenhCat || "",
      "Số tiền (VNĐ)": item.soTien,
      "Hình thức": item.hinhThuc === "tien_mat" ? "Tiền mặt" : "Chuyển khoản",
      "Người chi / thu thực tế": item.nguoiThucHien,
      "Bên nhận / chi": item.nguoiNhan || "",
      "Nội dung / Diễn giải": item.noiDung,
      "Người nhập hệ thống": item.nguoiNhap || "",
      "Email tài khoản nhập": item.emailNguoiNhap || "",
      "Vai trò tài khoản": item.roleNguoiNhap || "",
      "Có ảnh chứng từ": item.hinhAnh && item.hinhAnh.length > 0 ? "Có" : "Không",
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sổ Quỹ Thu Chi");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${tenFile}_${todayStr}.xlsx`);
}

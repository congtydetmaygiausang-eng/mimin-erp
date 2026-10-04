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
  
  // Thông tin tài khoản người đăng nhập nhập phiếu vào hệ thống
  nguoiNhap?: string; // Tên hiển thị tài khoản lúc tạo (VD: Hồ Minh Sang)
  emailNguoiNhap?: string; // Email tài khoản đăng nhập (VD: sang@mimin.vn)
  roleNguoiNhap?: string; // Vai trò tài khoản lúc tạo (VD: admin, accountant...)
  
  ngayTao: string; // ISO string
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
const SUPABASE_TABLE = "thu_chi_noi_bo";

/** Helper ánh xạ từ DB row (snake_case) sang GiaoDichThuChi (camelCase) */
function mapFromDbRow(row: any): GiaoDichThuChi {
  return {
    id: row.id,
    loai: row.loai,
    danhMuc: row.danh_muc,
    soTien: Number(row.so_tien) || 0,
    hinhThuc: row.hinh_thuc,
    ngay: row.ngay,
    nguoiThucHien: row.nguoi_thuc_hien,
    nguoiNhan: row.nguoi_nhan || undefined,
    noiDung: row.noi_dung,
    hinhAnh: Array.isArray(row.hinh_anh) ? row.hinh_anh : [],
    nguoiNhap: row.nguoi_nhap || undefined,
    emailNguoiNhap: row.email_nguoi_nhap || undefined,
    roleNguoiNhap: row.role_nguoi_nhap || undefined,
    ngayTao: row.ngay_tao || row.created_at || new Date().toISOString(),
  };
}

/** Helper ánh xạ từ GiaoDichThuChi sang DB row (snake_case) */
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

/** Lấy danh sách giao dịch từ localStorage (hoặc nạp mock nếu chưa có) */
export function getDanhSachThuChi(): GiaoDichThuChi[] {
  if (typeof window === "undefined") return MOCK_THU_CHI;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_THU_CHI));
      return MOCK_THU_CHI;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return MOCK_THU_CHI;
  } catch (err) {
    console.warn("Lỗi đọc danh sách thu chi từ localStorage:", err);
    return MOCK_THU_CHI;
  }
}

/** Lưu toàn bộ danh sách giao dịch vào localStorage */
export function luuDanhSachThuChi(danhSach: GiaoDichThuChi[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(danhSach));
  } catch (err) {
    console.error("Lỗi ghi danh sách thu chi vào localStorage:", err);
  }
}

/** Tải dữ liệu từ Supabase và merge vào localStorage */
export async function syncFromSupabase(): Promise<{ data: GiaoDichThuChi[]; error?: string }> {
  const localData = getDanhSachThuChi();
  if (!isSupabaseEnabled || !supabase) return { data: localData };

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("*")
      .order("ngay", { ascending: false });

    if (error) {
      console.warn(`[Supabase] Chưa đồng bộ được bảng ${SUPABASE_TABLE}:`, error.message);
      return { data: localData, error: error.message };
    }

    if (Array.isArray(data) && data.length > 0) {
      const remoteMapped = data.map(mapFromDbRow);
      luuDanhSachThuChi(remoteMapped);
      return { data: remoteMapped };
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

/** Cập nhật giao dịch */
export async function capNhatGiaoDich(
  id: string,
  updates: Partial<GiaoDichThuChi>
): Promise<{ item: GiaoDichThuChi | null; supabaseError?: string }> {
  const ds = getDanhSachThuChi();
  const idx = ds.findIndex((x) => x.id === id);
  if (idx === -1) return { item: null, supabaseError: "Không tìm thấy phiếu" };

  const updated: GiaoDichThuChi = { ...ds[idx], ...updates };
  ds[idx] = updated;
  luuDanhSachThuChi(ds);

  let supabaseError: string | undefined;

  // Cập nhật lên Supabase
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

/** Xoá giao dịch */
export async function xoaGiaoDich(id: string): Promise<{ success: boolean; supabaseError?: string }> {
  const ds = getDanhSachThuChi();
  const filtered = ds.filter((x) => x.id !== id);
  if (filtered.length === ds.length) return { success: false, supabaseError: "Không tìm thấy phiếu để xoá" };
  luuDanhSachThuChi(filtered);

  let supabaseError: string | undefined;

  // Xoá trên Supabase
  if (isSupabaseEnabled && supabase) {
    try {
      const { error } = await supabase.from(SUPABASE_TABLE).delete().eq("id", id);
      if (error) {
        console.warn(`[Supabase] Không thể xoá phiếu ${id} trên Supabase:`, error.message);
        supabaseError = error.message;
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

/** Tính tổng số tiền chi */
export function tinhTongChi(ds: GiaoDichThuChi[]): number {
  return ds
    .filter((x) => x.loai === "chi")
    .reduce((sum, x) => sum + (Number(x.soTien) || 0), 0);
}

/** Tính số dư chênh lệch thu - chi (tồn quỹ) */
export function tinhTonQuy(ds: GiaoDichThuChi[]): number {
  return tinhTongThu(ds) - tinhTongChi(ds);
}

/** Thống kê chi tiết theo từng danh mục */
export function thongKeTheoDanhMuc(
  ds: GiaoDichThuChi[],
  loai: LoaiThuChi
): { danhMuc: DanhMucThuChi; label: string; tongTien: number; tyLe: number; soGiaoDich: number }[] {
  const filtered = ds.filter((x) => x.loai === loai);
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
    return {
      STT: index + 1,
      "Mã GD": item.id,
      "Ngày": item.ngay,
      "Loại": item.loai === "thu" ? "Thu tiền (+)" : "Chi tiền (-)",
      "Danh mục": dmConfig?.label || item.danhMuc,
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

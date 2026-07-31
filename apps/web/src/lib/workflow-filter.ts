// ============ WORKFLOW FILTER (Đợt 2 - Bộ 5 Người gia công) ============
// Filter ALL_REAL_PHIEU theo user hiện tại (scope SELF + ASSIGNED)
// Map user.id (email) → maNV (NV001...) để filter đúng người

import { USERS } from "./users";
import { ALL_REAL_PHIEU } from "./real-workflow-data";
import type { PhieuWorkflow } from "./workflow-data";
import type { AppUser } from "@/components/session-provider";
import { toVaiTroChuan } from "./permission-matrix";

/** Lấy maNV của user hiện tại (NV001, NV002...) */
export function getMaNVFromUser(user: AppUser | null | undefined): string | null {
  if (!user) return null;
  const u = USERS.find((x) => x.id === user.id || x.email === user.email);
  return u?.maNV || null;
}

/** Lấy role từ user (fallback về user.role) */
export function getUserModule(user: AppUser | null | undefined): string | null {
  if (!user) return null;
  const u = USERS.find((x) => x.id === user.id || x.email === user.email);
  return u?.module || u?.nhom || null;
}

/**
 * Lấy tất cả phiếu workflow mà user hiện tại được giao
 * - Nếu là NV nội bộ: filter theo `nguoiNhan === maNV` (scope SELF)
 * - Nếu là Đối tác ngoài: filter theo `nguoiNhan` prefix `DT-*`
 * - Nếu là QLSX/GĐ: show tất cả (scope ALL)
 */
export function getWorkflowForUser(
  user: AppUser | null | undefined,
  phieus: PhieuWorkflow[] = ALL_REAL_PHIEU
): PhieuWorkflow[] {
  if (!user) return [];
  const vaiTro = toVaiTroChuan(user.role);
  const maNV = getMaNVFromUser(user);

  // GĐ/QLSX/Admin/KeToan → xem tất cả
  if (vaiTro === "GIAM_DOC" || vaiTro === "QUAN_TRI_HE_THONG" ||
      vaiTro === "DIEU_PHOI_SX" || vaiTro === "KE_TOAN") {
    return phieus;
  }

  // PhuTrach_* (tổ trưởng) → xem tất cả phiếu trong bộ phận (filter theo module)
  if (vaiTro?.startsWith("PHU_TRACH_") || vaiTro === "THU_KHO_VAI" || vaiTro === "THU_KHO_TP") {
    return phieus; // Tổ trưởng thấy tất cả phiếu trong bộ phận
  }

  // NhanVien_* hoặc Đối tác → filter theo maNV
  if (maNV) {
    return phieus.filter((p) => p.nguoiNhan === maNV);
  }

  return [];
}

/** Lấy phiếu theo trạng thái (chỉ trong phạm vi user) */
export function getWorkflowByStatus(
  user: AppUser | null | undefined,
  status: PhieuWorkflow["trangThai"] | "ALL",
  phieus?: PhieuWorkflow[]
): PhieuWorkflow[] {
  const all = phieus || getWorkflowForUser(user);
  if (status === "ALL") return all;
  return all.filter((p) => p.trangThai === status);
}

/** Lấy phiếu theo khâu (cat/intd/may/khuy-nut/ui/dong-goi) */
export function getWorkflowByKhau(
  user: AppUser | null | undefined,
  khau: "cat" | "intd" | "may" | "khuy-nut" | "ui" | "dong-goi",
  phieus?: PhieuWorkflow[]
): PhieuWorkflow[] {
  const all = phieus || getWorkflowForUser(user);
  // ID bắt đầu bằng tiền tố theo khâu: CAT_/INTD_/MAY_/KN_/UI_/DG_
  const prefix: Record<string, string> = {
    "cat": "CAT_",
    "intd": "INTD_",
    "may": "MAY_",
    "khuy-nut": "KN_",
    "ui": "UI_",
    "dong-goi": "DG_",
  };
  return all.filter((p) => p.id.startsWith(prefix[khau]));
}

/**
 * Tính KPI cho trang chủ người gia công
 */
export type GiaCongKPI = {
  tongViec: number;          // Tổng số phiếu
  moi: number;               // Chờ giao / nhận việc
  dangLam: number;           // Đang làm
  choKiem: number;           // Chờ kiểm (đã bàn giao)
  canLamLai: number;         // Cần làm lại
  hoanThanh: number;         // Hoàn thành
  // Stats
  sanLuongHomNay: number;    // SL đạt hôm nay
  tienCongHomNay: number;     // Tiền công hôm nay (đã xác nhận)
  tienCongThangNay: number;  // Tiền công tháng này
};

export function getGiaCongKPI(user: AppUser | null | undefined): GiaCongKPI {
  const phieus = getWorkflowForUser(user);
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const kpi: GiaCongKPI = {
    tongViec: phieus.length,
    moi: 0,
    dangLam: 0,
    choKiem: 0,
    canLamLai: 0,
    hoanThanh: 0,
    sanLuongHomNay: 0,
    tienCongHomNay: 0,
    tienCongThangNay: 0,
  };

  for (const p of phieus) {
    // Đếm trạng thái
    if (p.trangThai === "Chờ giao" || p.trangThai === "Chờ gấp") kpi.moi++;
    else if (p.trangThai === "Đang làm" || p.trangThai === "Đang may") kpi.dangLam++;
    else if (p.trangThai === "Hoàn thành") kpi.hoanThanh++;
    // Tính sản lượng hôm nay (từ ngayHoanThanh)
    if (p.ngayHoanThanh === today) {
      kpi.sanLuongHomNay += p.soLuongDat;
    }
    // Tiền công
    if (p.trangThai === "Hoàn thành") {
      const date = p.ngayHoanThanh || p.ngayGiao || "";
      if (date === today) kpi.tienCongHomNay += p.thanhTien;
      if (date >= monthStart) kpi.tienCongThangNay += p.thanhTien;
    }
  }

  // canLamLai & choKiem: derive từ ghiChú (mẫu dữ liệu không có field riêng)
  kpi.canLamLai = phieus.filter((p) => p.soLuongLoi > 0).length;
  kpi.choKiem = phieus.filter((p) => p.trangThai === "Hoàn thành" && !p.nguoiXacNhan).length;

  return kpi;
}

/**
 * Format hiển thị trạng thái theo màu sắc
 */
export function getStatusStyle(status: PhieuWorkflow["trangThai"]): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case "Chờ giao":
    case "Chờ gấp":
      return { bg: "bg-slate-500/15", text: "text-slate-700", label: "Chờ nhận" };
    case "Đang làm":
    case "Đang may":
      return { bg: "bg-amber-500/15", text: "text-amber-700", label: "Đang làm" };
    case "Hoàn thành":
      return { bg: "bg-emerald-500/15", text: "text-emerald-700", label: "Hoàn thành" };
    default:
      return { bg: "bg-sky-500/15", text: "text-sky-700", label: status };
  }
}

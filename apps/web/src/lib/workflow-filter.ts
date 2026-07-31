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
 *
 * Lưu ý: Hàm này nhận `phieus` (đã merge taskStates) thay vì tự gọi getWorkflowForUser
 * để đảm bảo KPI phản ánh đúng trạng thái workflow đã thay đổi bởi gia-cong-store
 * (FIX BUG #1 - trước đây KPI tính từ ALL_REAL_PHIEU gốc, list dưới merge với taskStates
 *  → user nhận việc → kpi.moi không giảm nhưng list "Lệnh mới" giảm, số liệu không khớp)
 *
 * @param phieus Danh sách phiếu (thường là effectiveWorkflow đã merge taskStates)
 * @param sanLuongUpdatesCuaUser Mảng SanLuongUpdate của user hiện tại (để tính SL hôm nay chính xác)
 */
export type GiaCongKPI = {
  tongViec: number;          // Tổng số phiếu
  moi: number;               // Chờ giao / nhận việc
  dangLam: number;           // Đang làm
  choKiem: number;           // Chờ kiểm (đã bàn giao, chưa xác nhận)
  canLamLai: number;         // Có lỗi và chưa hoàn thành
  hoanThanh: number;         // Hoàn thành
  // Stats
  sanLuongHomNay: number;    // SL đạt hôm nay (từ sanLuongUpdates)
  tienCongHomNay: number;     // Tiền công hôm nay (đã xác nhận)
  tienCongThangNay: number;  // Tiền công tháng này
};

export function getGiaCongKPI(
  phieus: PhieuWorkflow[],
  sanLuongUpdatesCuaUser?: Array<{ ngay: string; soLuongDat: number }>
): GiaCongKPI {
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
    // canLamLai: phiếu có lỗi và CHƯA hoàn thành (FIX BUG #7 logic mơ hồ)
    if (p.trangThai !== "Hoàn thành" && p.soLuongLoi > 0) kpi.canLamLai++;
    // choKiem: hoàn thành nhưng chưa có người xác nhận
    if (p.trangThai === "Hoàn thành" && !p.nguoiXacNhan) kpi.choKiem++;
    // Tiền công (FIX BUG #2: dùng soLuongDat * donGia thay vì thanhTien gốc
    //  để đồng nhất với trang tien-cong và phản ánh SL mới khi user update)
    if (p.trangThai === "Hoàn thành") {
      const tienCong = p.soLuongDat * p.donGia;
      const date = p.ngayHoanThanh || p.ngayGiao || "";
      if (date === today) kpi.tienCongHomNay += tienCong;
      if (date >= monthStart) kpi.tienCongThangNay += tienCong;
    }
  }

  // SanLuong hom nay (FIX BUG #3: dùng sanLuongUpdates thay vì ngayHoanThanh gốc
  //  vì user có thể báo cáo SL hôm nay nhưng phiếu chưa bàn giao nên ngayHoanThanh = "")
  if (sanLuongUpdatesCuaUser && sanLuongUpdatesCuaUser.length > 0) {
    kpi.sanLuongHomNay = sanLuongUpdatesCuaUser
      .filter((u) => u.ngay === today)
      .reduce((sum, u) => sum + u.soLuongDat, 0);
  } else {
    // Fallback: dùng ngayHoanThanh gốc nếu không có updates
    for (const p of phieus) {
      if (p.ngayHoanThanh === today) {
        kpi.sanLuongHomNay += p.soLuongDat;
      }
    }
  }

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

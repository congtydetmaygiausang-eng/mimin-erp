// Auto-sync hook - tự động push phiếu lên Lark khi có thay đổi

import { isLarkEnabled, pushPhieuToLark, pullPhieuFromLark, saveLarkConfig, getLarkConfig } from "./lark";
import type { PhieuWorkflow } from "./workflow-data";
import { logAudit } from "./audit-log";

// Track lần sync cuối + phiếu đã sync
const SYNC_KEY = "mimin_lark_sync_state_v1";

type SyncState = {
  lastSyncAt: string;
  lastPullAt: string;
  syncedIds: string[];
  failedIds: { id: string; error: string }[];
  enabled: boolean;
};

function getSyncState(): SyncState {
  if (typeof window === "undefined") {
    return { lastSyncAt: "", lastPullAt: "", syncedIds: [], failedIds: [], enabled: false };
  }
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return { lastSyncAt: "", lastPullAt: "", syncedIds: [], failedIds: [], enabled: isLarkEnabled() };
    return { ...JSON.parse(raw), enabled: isLarkEnabled() };
  } catch {
    return { lastSyncAt: "", lastPullAt: "", syncedIds: [], failedIds: [], enabled: isLarkEnabled() };
  }
}

function setSyncState(state: SyncState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_KEY, JSON.stringify(state));
}

// ============ AUTO PUSH ============

/**
 * Push 1 phiếu lên Lark. Gọi tự động sau khi user tiếp nhận/hoàn thành/báo cáo
 */
export async function autoPushPhieu(phieu: PhieuWorkflow, user: any): Promise<{ ok: boolean; error?: string }> {
  if (!isLarkEnabled()) return { ok: true }; // Skip nếu chưa config

  const result = await pushPhieuToLark(phieu);
  const state = getSyncState();

  if (result.ok) {
    if (!state.syncedIds.includes(phieu.id)) {
      state.syncedIds.push(phieu.id);
    }
    state.failedIds = state.failedIds.filter((f) => f.id !== phieu.id);
    state.lastSyncAt = new Date().toISOString();
    setSyncState(state);

    logAudit({
      user,
      action: "update",
      module: "lark-sync" as any,
      description: `Đồng bộ phiếu ${phieu.id} lên Lark ✓`,
      resourceId: phieu.id,
      success: true,
    });
  } else {
    state.failedIds.push({ id: phieu.id, error: result.error || "Unknown" });
    setSyncState(state);
    logAudit({
      user,
      action: "update",
      module: "lark-sync" as any,
      description: `Lỗi sync phiếu ${phieu.id}: ${result.error}`,
      resourceId: phieu.id,
      success: false,
      errorMessage: result.error,
    });
  }

  return result;
}

// ============ PULL FROM LARK ============

/**
 * Pull tất cả records từ 5 bảng Lark về ERP
 */
export async function pullAllFromLark(user: any): Promise<{
  total: number;
  byKhau: Record<string, number>;
  errors: string[];
}> {
  if (!isLarkEnabled()) {
    return { total: 0, byKhau: {}, errors: ["Lark chưa được cấu hình"] };
  }

  const results: Record<string, PhieuWorkflow[]> = {};
  const errors: string[] = [];

  for (const khau of ["INTD", "MAY", "KN", "UI", "DG"] as const) {
    try {
      results[khau] = await pullPhieuFromLark(khau);
    } catch (e: any) {
      errors.push(`${khau}: ${e.message}`);
    }
  }

  // Lưu vào localStorage (override ERP data)
  const STORAGE_KEY = "mimin_phieu_workflow_v1";
  const allPhieu: Record<string, PhieuWorkflow> = {};
  Object.values(results).flat().forEach((p) => {
    if (p.id) allPhieu[p.id] = p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPhieu));

  const state = getSyncState();
  state.lastPullAt = new Date().toISOString();
  setSyncState(state);

  const total = Object.values(results).reduce((s, arr) => s + arr.length, 0);
  logAudit({
    user,
    action: "import",
    module: "lark-sync" as any,
    description: `Pull ${total} phiếu từ Lark về ERP`,
    success: errors.length === 0,
    errorMessage: errors.join("; "),
  });

  return {
    total,
    byKhau: {
      "In/Thêu/Dập": results.INTD?.length || 0,
      "May": results.MAY?.length || 0,
      "Khuy nút": results.KN?.length || 0,
      "Ủi": results.UI?.length || 0,
      "Gấp xếp/Đóng gói": results.DG?.length || 0,
    },
    errors,
  };
}

// ============ WEBHOOK HANDLER ============

/**
 * Xử lý webhook từ Lark khi chị Giàu sửa record trên Lark
 * Lark gửi POST request với payload chứa thông tin record thay đổi
 */
export function handleLarkWebhook(payload: any, user: any): { ok: boolean; action: string; phieuId?: string } {
  // Lark webhook format:
  // {
  //   "schema": "2.0",
  //   "header": { "event_type": "drive.file.bitable_record_changed_v1" },
  //   "event": {
  //     "file_token": "...",
  //     "table_id": "...",
  //     "action_list": [
  //       { "action": "create" | "update" | "delete", "record_id": "...", "fields": {...} }
  //     ]
  //   }
  // }

  try {
    const event = payload?.event;
    if (!event) return { ok: false, action: "no_event" };

    const tableId = event.table_id;
    const config = getLarkConfig();
    if (!config) return { ok: false, action: "no_config" };

    // Map table_id → khau
    let khau: string;
    if (tableId === config.tableIds.inTheuDap) khau = "INTD";
    else if (tableId === config.tableIds.may) khau = "MAY";
    else if (tableId === config.tableIds.khuyNut) khau = "KN";
    else if (tableId === config.tableIds.ui) khau = "UI";
    else if (tableId === config.tableIds.dongGoi) khau = "DG";
    else return { ok: false, action: "unknown_table" };

    const action = event.action_list?.[0];
    if (!action) return { ok: false, action: "no_action" };

    if (action.action === "delete") {
      // Xoá record
      const STORAGE_KEY = "mimin_phieu_workflow_v1";
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      // Tìm phiếu có record_id tương ứng
      Object.entries(all).forEach(([id, p]: [string, any]) => {
        if (p.larkRecordId === action.record_id) {
          delete all[id];
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      logAudit({ user, action: "delete", module: "lark-sync" as any, description: `Webhook: Xoá phiếu ${action.record_id} từ Lark`, success: true });
      return { ok: true, action: "deleted" };
    }

    // Create / Update
    const phieu = convertLarkFieldsToPhieu(action.fields, khau);
    phieu.larkRecordId = action.record_id;

    const STORAGE_KEY = "mimin_phieu_workflow_v1";
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[phieu.id] = phieu;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    logAudit({
      user,
      action: action.action === "create" ? "create" : "update",
      module: "lark-sync" as any,
      description: `Webhook: ${action.action === "create" ? "Tạo" : "Sửa"} phiếu ${phieu.id} từ Lark`,
      resourceId: phieu.id,
      success: true,
    });

    return { ok: true, action: action.action, phieuId: phieu.id };
  } catch (e: any) {
    return { ok: false, action: "error: " + e.message };
  }
}

function convertLarkFieldsToPhieu(fields: any, khau: string): PhieuWorkflow {
  const toDate = (ts: any) => ts ? new Date(ts).toISOString().slice(0, 10) : undefined;
  let map: any;
  if (khau === "INTD") map = {
    maPhieu: "ma_phieu", lenhSX: "ma_lenh_sx", maSP: "ma_san_pham",
    phanLoai: "cong_doan", mau: "mau", size: "size",
    soLuongGiao: "so_luong_giao", ngayGiao: "ngay_giao", nguoiGiao: "nguoi_giao",
    doiTacNhan: "doi_tac_nhan", hanTraHang: "han_tra_hang",
    soLuongNhan: "so_luong_nhan", soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi", soLuongThieu: "so_luong_thieu",
    donGia: "don_gia", thanhTien: "thanh_tien",
    trangThai: "trang_thai", ghiChu: "ghi_chu", viTriIn: "vi_tri_thuc_hien",
  };
  else if (khau === "MAY") map = {
    maPhieu: "ma_phieu", lenhSX: "ma_lenh_sx", maSP: "ma_san_pham",
    phanLoai: "loai_san_pham", kieuMay: "kieu_may", mau: "mau", size: "size",
    soLuongGiao: "so_luong_giao", ngayGiao: "ngay_giao", nguoiGiao: "nguoi_giao",
    xuongNhan: "xuong_nhan_may", hanHoanThanh: "han_hoan_thanh",
    soLuongNhan: "so_luong_nhan_ve", soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi", soLuongThieu: "so_luong_thieu",
    soLuongSua: "so_luong_sua_lai", donGia: "don_gia_may", thanhTien: "thanh_tien",
    daThanhToan: "tien_da_thanh_toan", conNo: "cong_no_con_lai",
    trangThai: "trang_thai", ghiChu: "ghi_chu",
  };
  else if (khau === "KN") map = {
    maPhieu: "ma_phieu", lenhSX: "ma_lenh_sx", maSP: "ma_san_pham",
    mauSize: "mau_size", soLuongNhan: "so_luong_nhan",
    soLuongDat: "so_luong_dat", soLuongLoi: "so_luong_loi",
    nguoiThucHien: "nguoi_thuc_hien", donGia: "don_gia", thanhTien: "thanh_tien",
    trangThai: "trang_thai", ghiChu: "ghi_chu",
  };
  else if (khau === "UI") map = {
    maPhieu: "ma_phieu", lenhSX: "ma_lenh_sx", maSP: "ma_san_pham",
    phanLoai: "loai_san_pham", mauSize: "mau_size",
    soLuongNhan: "so_luong_nhan", soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi", nguoiThucHien: "nguoi_thuc_hien",
    donGia: "don_gia", thanhTien: "thanh_tien",
    trangThai: "trang_thai", ghiChu: "ghi_chu",
  };
  else map = {
    maPhieu: "ma_phieu", lenhSX: "ma_lenh_sx", maSP: "ma_san_pham",
    phanLoai: "phan_loai", mau: "mau", size: "size",
    soLuongNhan: "so_luong_nhan", soLuongDat: "so_luong_dat",
    soLuongLoi: "so_luong_loi", nguoiThucHien: "nguoi_thuc_hien",
    donGia: "don_gia", thanhTien: "thanh_tien",
    trangThai: "trang_thai", ghiChu: "ghi_chu",
  };

  return {
    id: fields[map.maPhieu] || "",
    lenhSX: fields[map.lenhSX] || "",
    lenhCat: "",
    maSP: fields[map.maSP] || "",
    phanLoai: fields[map.phanLoai] || "",
    mau: fields[map.mau] || (fields[map.mauSize]?.split(" ")[0] || ""),
    size: fields[map.size] || (fields[map.mauSize]?.split(" ")[1] || ""),
    viTriIn: fields[map.viTriIn],
    kieuMay: fields[map.kieuMay],
    soLuongGiao: fields[map.soLuongGiao] || 0,
    soLuongNhan: fields[map.soLuongNhan] || 0,
    soLuongDat: fields[map.soLuongDat] || 0,
    soLuongLoi: fields[map.soLuongLoi] || 0,
    soLuongThieu: fields[map.soLuongThieu] || 0,
    soLuongSua: fields[map.soLuongSua] || 0,
    nguoiGiao: fields[map.nguoiGiao] || "",
    nguoiNhan: "",
    tenNguoiNhan: fields[map.doiTacNhan] || fields[map.xuongNhan] || fields[map.nguoiThucHien] || "",
    ngayGiao: toDate(fields[map.ngayGiao]),
    ngayNhan: toDate(fields[map.ngayNhan]),
    ngayHoanThanh: toDate(fields[map.ngayHoanThanh]),
    hanHoanThanh: toDate(fields[map.hanTraHang] || fields[map.hanHoanThanh]) || "",
    donGia: fields[map.donGia] || fields[map.donGiaMay] || 0,
    thanhTien: fields[map.thanhTien] || 0,
    daThanhToan: fields[map.daThanhToan] || 0,
    conNo: fields[map.conNo] || 0,
    trangThai: fields[map.trangThai] || "Chờ giao",
    ghiChu: fields[map.ghiChu],
    mauDaDuyet: false,
    larkRecordId: "",  // Set by caller
  } as any;
}

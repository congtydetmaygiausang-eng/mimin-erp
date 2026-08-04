"use client";

// ============ QC STORE (Đợt 8 - Bộ 8) ============
// Kiểm tra chất lượng - QC nhận sản phẩm từ các công đoạn
// Lưu localStorage `mimin_qc_v1`
// 5 trạng thái: Chờ kiểm → Đang kiểm → Đạt → Có lỗi → Đã xử lý lỗi
//
// Workflow:
// 1. Công đoạn trước Hoàn thành → push vào QC queue (status: "Chờ kiểm")
// 2. QC nhận → "Đang kiểm"
// 3. QC đánh giá:
//    - Đạt → "Đạt" → push sang công đoạn sau
//    - Có lỗi → "Có lỗi" → báo lỗi về NV trước để rework
// 4. NV rework xong → "Đã xử lý lỗi" → quay lại QC

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";
import { ALL_REAL_PHIEU } from "../real-workflow-data";
import type { PhieuWorkflow } from "../workflow-data";
import { supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

export type TrangThaiQC =
  | "Chờ kiểm"      // Công đoạn trước xong, chờ QC nhận
  | "Đang kiểm"     // QC đang kiểm
  | "Đạt"           // Đạt yêu cầu
  | "Có lỗi"        // Phát hiện lỗi, báo NV trước
  | "Đã xử lý lỗi"; // NV đã rework, chờ QC duyệt lại

export const TRANG_THAI_QC: TrangThaiQC[] = [
  "Chờ kiểm", "Đang kiểm", "Đạt", "Có lỗi", "Đã xử lý lỗi",
];

export const TRANG_THAI_QC_STYLE: Record<TrangThaiQC, { color: string; bg: string }> = {
  "Chờ kiểm": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Đang kiểm": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Đạt": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
  "Có lỗi": { color: "text-rose-700", bg: "bg-rose-500/15" },
  "Đã xử lý lỗi": { color: "text-sky-700", bg: "bg-sky-500/15" },
};

export type LoiQC = {
  id: string;
  loai: "mop" | "rach" | "buc-chi" | "sai-mau" | "sai-size" | "khac";
  moTa: string;
  soLuong: number;
};

export type BanGhiQC = {
  id: string;              // QC-{taskId}
  taskId: string;          // MAY_001, KN_001...
  lenhSX: string;
  maSP: string;
  phanLoai?: string;
  congDoan: string;        // Cắt / May / Hoàn thiện
  nguoiThucHien: string;   // NV giao hàng trước
  soLuongGiao: number;
  soLuongKiem: number;     // QC lấy mẫu bao nhiêu
  soLuongDat: number;      // SL đạt yêu cầu
  soLuongLoi: number;      // SL lỗi
  tiLeDat: number;          // % đạt
  loi?: LoiQC[];           // Danh sách lỗi chi tiết
  trangThai: TrangThaiQC;
  nguoiKiem?: string;      // QC phụ trách
  ngayKiem?: string;
  ngayHoanThanh?: string;
  ghiChu?: string;
  lichSu: Array<{
    ngay: string;
    trangThaiCu: TrangThaiQC;
    trangThaiMoi: TrangThaiQC;
    nguoiThucHien: string;
    ghiChu?: string;
  }>;
};

const STORAGE_KEY = "mimin_qc_v1";

function taskToQC(t: PhieuWorkflow): BanGhiQC | null {
  // Lấy phiếu đã Hoàn thành hoặc Đang làm từ workflow thật
  if (t.trangThai !== "Hoàn thành") return null;
  // Chỉ lấy các công đoạn có SP ra thành phẩm (trừ phiếu outsource)
  if (t.nguoiNhan.startsWith("DT-")) return null;
  return {
    id: `QC-${t.id}`,
    taskId: t.id,
    lenhSX: t.lenhSX,
    maSP: t.maSP,
    phanLoai: t.phanLoai,
    congDoan: t.id.startsWith("CAT_") ? "Cắt" : t.id.startsWith("INTD_") ? "In/Thêu" : t.id.startsWith("MAY_") ? "May" : t.id.startsWith("KN_") ? "Khuy nút" : t.id.startsWith("UI_") ? "Ủi" : t.id.startsWith("DG_") ? "Đóng gói" : "Khác",
    nguoiThucHien: t.tenNguoiNhan,
    soLuongGiao: t.soLuongGiao,
    soLuongKiem: 0,
    soLuongDat: t.soLuongDat,
    soLuongLoi: t.soLuongLoi,
    tiLeDat: t.soLuongDat + t.soLuongLoi > 0 ? Math.round((t.soLuongDat / (t.soLuongDat + t.soLuongLoi)) * 100) : 100,
    trangThai: t.soLuongLoi > 0 ? "Chờ kiểm" : "Đạt",
    ngayKiem: t.ngayHoanThanh,
    ghiChu: t.ghiChu,
    lichSu: [],
  };
}

function buildDefault(): BanGhiQC[] {
  return ALL_REAL_PHIEU.map(taskToQC).filter((q): q is BanGhiQC => q !== null);
}

type StoreContext = {
  banGhi: BanGhiQC[];
  nhanKiem: (id: string, user: AppUser | null) => void;
  dat: (id: string, slDat: number, slLoi: number, ghiChu: string | undefined, user: AppUser | null) => void;
  baoLoi: (id: string, loi: LoiQC[], ghiChu: string | undefined, user: AppUser | null) => void;
  xuLyLoi: (id: string, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): BanGhiQC[] {
  if (typeof window === "undefined") return buildDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BanGhiQC[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return buildDefault();
}

function saveData(d: BanGhiQC[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function QCProvider({ children }: { children: ReactNode }) {
  const [banGhi, setBanGhi] = useState<BanGhiQC[]>(buildDefault);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBanGhi(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(banGhi);
  }, [banGhi, hydrated]);

  const updateStatus = useCallback((id: string, trangThaiMoi: TrangThaiQC, user: AppUser | null, ghiChu?: string) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const lichSuMoi = [...(b.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: b.trangThai,
        trangThaiMoi,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = {
        ...b,
        trangThai: trangThaiMoi,
        nguoiKiem: user?.name || user?.id,
        ngayKiem: new Date().toISOString().split("T")[0],
        ngayHoanThanh: trangThaiMoi === "Đạt" ? new Date().toISOString().split("T")[0] : b.ngayHoanThanh,
        lichSu: lichSuMoi,
      };
      return updated;
    }));
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("qc_records", updated as any).catch((err) =>
        console.error("[QCStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const nhanKiem = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Đang kiểm", user, "QC nhận kiểm");
    logWorkflow(user, "receive", `QC nhận ${id}`, id);
  }, [updateStatus]);

  const dat = useCallback((id: string, slDat: number, slLoi: number, ghiChu: string | undefined, user: AppUser | null) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const tiLe = slDat + slLoi > 0 ? Math.round((slDat / (slDat + slLoi)) * 100) : 100;
      const lichSuMoi = [...(b.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: b.trangThai,
        trangThaiMoi: "Đạt" as TrangThaiQC,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = {
        ...b,
        soLuongKiem: slDat + slLoi,
        soLuongDat: slDat,
        soLuongLoi: slLoi,
        tiLeDat: tiLe,
        trangThai: "Đạt",
        nguoiKiem: user?.name || user?.id,
        ngayHoanThanh: new Date().toISOString().split("T")[0],
        lichSu: lichSuMoi,
      };
      return updated;
    }));
    logWorkflow(user, "approve", `QC duyệt ${id}`, id, { newValue: { slDat, slLoi } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("qc_records", updated as any).catch((err) =>
        console.error("[QCStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const baoLoi = useCallback((id: string, loi: LoiQC[], ghiChu: string | undefined, user: AppUser | null) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const lichSuMoi = [...(b.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: b.trangThai,
        trangThaiMoi: "Có lỗi" as TrangThaiQC,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = { ...b, loi, trangThai: "Có lỗi", lichSu: lichSuMoi };
      return updated;
    }));
    logWorkflow(user, "report_issue", `QC báo lỗi ${id}`, id, { newValue: { soLoi: loi.length } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("qc_records", updated as any).catch((err) =>
        console.error("[QCStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const xuLyLoi = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Đã xử lý lỗi", user, "NV đã rework");
    logWorkflow(user, "rework", `Xử lý lỗi ${id}`, id);
  }, [updateStatus]);

  const reset = useCallback(() => {
    setBanGhi(buildDefault());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ banGhi, nhanKiem, dat, baoLoi, xuLyLoi, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useQC() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQC must be used within QCProvider");
  return ctx;
}

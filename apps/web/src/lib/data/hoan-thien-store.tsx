"use client";

// ============ HOÀN THIỆN STORE (Đợt 6 - Bộ 6) ============
// Mobile-first cho NV Hoàn thiện (Khuy nút / Ủi / Gấp xếp / Đóng gói)
// Lưu localStorage `mimin_hoan_thien_v1`
// 6 trạng thái: Chờ nhận → Đã nhận → Đang làm → Chờ QC → Hoàn thành → Bàn giao kho TP
//
// Workflow:
// 1. May xong → Tạo phiếu Hoàn thiện (trangThai: "Chờ nhận")
// 2. NV Hoàn thiện nhận → "Đã nhận"
// 3. Bắt đầu làm → "Đang làm"
// 4. Làm xong → "Chờ QC"
// 5. QC duyệt → "Hoàn thành"
// 6. Bàn giao kho TP → "Bàn giao kho TP"
// 7. Auto push DoiSoatProvider (Đợt 5) - Kế toán đối soát

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";
import { ALL_REAL_PHIEU } from "../real-workflow-data";
import type { PhieuWorkflow } from "../workflow-data";
import { useSupabaseRealtime } from "@/lib/supabase/sync-helper";
import { supabaseUpsertRaw, supabaseDelete, supabaseFetchAllRaw, isSupabaseEnabled } from "@/lib/supabase/client";

export type TrangThaiHoanThien =
  | "Chờ nhận"      // May xong, NV HT chưa nhận
  | "Đã nhận"        // NV đã nhận hàng
  | "Đang làm"      // Đang thực hiện
  | "Chờ QC"        // Làm xong, chờ QC duyệt
  | "Hoàn thành"    // QC đã duyệt
  | "Bàn giao kho TP"; // Đã bàn giao kho thành phẩm

export const TRANG_THAI_HOAN_THIEN: TrangThaiHoanThien[] = [
  "Chờ nhận",
  "Đã nhận",
  "Đang làm",
  "Chờ QC",
  "Hoàn thành",
  "Bàn giao kho TP",
];

export const TRANG_THAI_HT_STYLE: Record<TrangThaiHoanThien, { color: string; bg: string }> = {
  "Chờ nhận": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Đã nhận": { color: "text-sky-700", bg: "bg-sky-500/15" },
  "Đang làm": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Chờ QC": { color: "text-violet-700", bg: "bg-violet-500/15" },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
  "Bàn giao kho TP": { color: "text-teal-700", bg: "bg-teal-500/15" },
};

export type CongDoanHoanThien = "Khuy nút" | "Ủi" | "Gấp xếp/Đóng gói";

export type BanGhiHoanThien = {
  id: string;              // "HT-{taskId}" - VD: HT-KN_001
  taskId: string;          // KN_001, UI_001, DG_001
  lenhSX: string;          // LSX-2026-001
  maSP: string;            // M758
  phanLoai?: string;
  mau?: string;
  size?: string;
  congDoan: CongDoanHoanThien;
  nguoiThucHien: string;   // Tên NV
  nguoiThucHienMa: string; // NV011, NV017
  ngayGiao?: string;
  hanHoanThanh: string;
  ngayNhan?: string;
  ngayHoanThanh?: string;
  ngayBanGiao?: string;
  soLuongGiao: number;
  soLuongNhan: number;
  soLuongDat: number;
  soLuongLoi: number;
  donGia: number;
  thanhTien: number;
  ghiChu?: string;
  trangThai: TrangThaiHoanThien;
  lichSu: Array<{
    ngay: string;
    trangThaiCu: TrangThaiHoanThien;
    trangThaiMoi: TrangThaiHoanThien;
    nguoiThucHien: string;
    ghiChu?: string;
  }>;
  locked?: boolean;
};

const STORAGE_KEY = "mimin_hoan_thien_v1";

/** Convert taskId → bản ghi hoàn thiện ban đầu */
function taskToHoanThien(t: PhieuWorkflow): BanGhiHoanThien | null {
  // Chỉ lấy phiếu KN / UI / DG (công đoạn cuối)
  const congDoan: CongDoanHoanThien | null = t.id.startsWith("KN_") ? "Khuy nút"
    : t.id.startsWith("UI_") ? "Ủi"
    : t.id.startsWith("DG_") ? "Gấp xếp/Đóng gói"
    : null;
  if (!congDoan) return null;

  // Map trạng thái workflow → hoàn thiện
  const trangThai: TrangThaiHoanThien =
    t.trangThai === "Chờ giao" || t.trangThai === "Chờ gấp" ? "Chờ nhận"
    : t.trangThai === "Hoàn thành" ? "Hoàn thành"
    : t.trangThai === "Đang làm" ? "Đang làm"
    : "Chờ nhận";

  return {
    id: `HT-${t.id}`,
    taskId: t.id,
    lenhSX: t.lenhSX,
    maSP: t.maSP,
    phanLoai: t.phanLoai,
    mau: t.mau,
    size: t.size,
    congDoan,
    nguoiThucHien: t.tenNguoiNhan,
    nguoiThucHienMa: t.nguoiNhan,
    ngayGiao: t.ngayGiao,
    hanHoanThanh: t.hanHoanThanh,
    ngayNhan: t.ngayNhan,
    ngayHoanThanh: t.ngayHoanThanh,
    soLuongGiao: t.soLuongGiao,
    soLuongNhan: t.soLuongNhan || t.soLuongGiao,
    soLuongDat: t.soLuongDat,
    soLuongLoi: t.soLuongLoi,
    donGia: t.donGia,
    thanhTien: t.thanhTien,
    ghiChu: t.ghiChu,
    trangThai,
    lichSu: [],
  };
}

function buildDefault(): BanGhiHoanThien[] {
  return ALL_REAL_PHIEU
    .map(taskToHoanThien)
    .filter((b): b is BanGhiHoanThien => b !== null);
}

type StoreContext = {
  banGhi: BanGhiHoanThien[];
  nhanViec: (id: string, user: AppUser | null) => void;
  batDauLam: (id: string, user: AppUser | null) => void;
  capNhatSanLuong: (id: string, slDat: number, slLoi: number, user: AppUser | null) => void;
  hoanThanh: (id: string, user: AppUser | null) => void;
  banGiao: (id: string, user: AppUser | null) => void;
  baoLoi: (id: string, noiDung: string, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): BanGhiHoanThien[] {
  if (typeof window === "undefined") return buildDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BanGhiHoanThien[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return buildDefault();
}

function saveData(d: BanGhiHoanThien[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function HoanThienProvider({ children }: { children: ReactNode }) {
  const [banGhi, setBanGhi] = useState<BanGhiHoanThien[]>(buildDefault);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBanGhi(loadData());
    setHydrated(true);
  }, []);

  
  useSupabaseRealtime<any>("hoan_thien", setBanGhi, {
    primaryKey: "id"
  });
  

  // Đọc lại 2 chiều từ Supabase (nguồn chính). Bảng camelCase → đọc/ghi không convert key.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    let mounted = true;
    (async () => {
      const remote = await supabaseFetchAllRaw<BanGhiHoanThien>("hoan_thien", "created_at", false);
      if (!mounted || remote.length === 0) return;
      const ids = new Set(remote.map((r) => r.id));
      setBanGhi((prev) => {
        const localOnly = prev.filter((x) => !ids.has(x.id));
        const merged = [...remote, ...localOnly];
        saveData(merged);
        return merged;
      });
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (hydrated) saveData(banGhi);
  }, [banGhi, hydrated]);

  const updateStatus = useCallback((id: string, trangThaiMoi: TrangThaiHoanThien, user: AppUser | null, ghiChu?: string) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (b.locked) return b;
      const lichSuMoi = [...(b.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: b.trangThai,
        trangThaiMoi,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = { ...b, trangThai: trangThaiMoi, lichSu: lichSuMoi };
      return updated;
    }));
    logWorkflow(user, "update", `Hoàn thiện ${id} → ${trangThaiMoi}`, id, { newValue: { trangThaiMoi } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsertRaw("hoan_thien", updated as any).catch((err) =>
        console.error("[HoanThienStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const nhanViec = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Đã nhận", user, "NV nhận việc");
  }, [updateStatus]);

  const batDauLam = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Đang làm", user, "Bắt đầu làm");
  }, [updateStatus]);

  const capNhatSanLuong = useCallback((id: string, slDat: number, slLoi: number, user: AppUser | null) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (b.locked) return b;
      const thanhTienMoi = slDat * b.donGia;
      updated = { ...b, soLuongDat: slDat, soLuongLoi: slLoi, thanhTien: thanhTienMoi };
      return updated;
    }));
    logWorkflow(user, "report_progress", `Cập nhật SL ${id}`, id, { newValue: { slDat, slLoi } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsertRaw("hoan_thien", updated as any).catch((err) =>
        console.error("[HoanThienStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Hoàn thành", user, "Hoàn thành");
  }, [updateStatus]);

  const banGiao = useCallback((id: string, user: AppUser | null) => {
    let updated: any = null;
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (b.locked) return b;
      const lichSuMoi = [...(b.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: b.trangThai,
        trangThaiMoi: "Bàn giao kho TP" as TrangThaiHoanThien,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu: "Bàn giao kho thành phẩm",
      }];
      updated = {
        ...b,
        trangThai: "Bàn giao kho TP" as TrangThaiHoanThien,
        ngayBanGiao: new Date().toISOString().split("T")[0],
        lichSu: lichSuMoi,
      };
      return updated;
    }));
    logWorkflow(user, "handover", `Bàn giao kho TP ${id}`, id);
    if (isSupabaseEnabled && updated) {
      supabaseUpsertRaw("hoan_thien", updated as any).catch((err) =>
        console.error("[HoanThienStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const baoLoi = useCallback((id: string, noiDung: string, user: AppUser | null) => {
    let updated: any = null;
    const lichSuMoi = {
      ngay: new Date().toISOString(),
      trangThaiCu: "Đang làm" as TrangThaiHoanThien,
      trangThaiMoi: "Đang làm" as TrangThaiHoanThien,
      nguoiThucHien: user?.name || user?.id || "unknown",
      ghiChu: `Báo lỗi: ${noiDung}`,
    };
    setBanGhi((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      updated = { ...b, lichSu: [...(b.lichSu || []), lichSuMoi] };
      return updated;
    }));
    logWorkflow(user, "report_issue", `Báo lỗi ${id}`, id, { newValue: { noiDung } });
    if (isSupabaseEnabled && updated) {
      supabaseUpsertRaw("hoan_thien", updated as any).catch((err) =>
        console.error("[HoanThienStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const reset = useCallback(() => {
    setBanGhi(buildDefault());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{
        banGhi, nhanViec, batDauLam, capNhatSanLuong, hoanThanh, banGiao, baoLoi, reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useHoanThien() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHoanThien must be used within HoanThienProvider");
  return ctx;
}

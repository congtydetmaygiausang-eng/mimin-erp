"use client";

// ============ KHO MOBILE STORE (Đợt 7 - Bộ 7) ============
// Mobile-first cho NV Kho: Vải / Phụ liệu / Thành phẩm
// Lưu localStorage `mimin_kho_mobile_v1` (phiếu nhập/xuất/kiểm kê)
// Data thật: KHO_VAI, KHO_VAT_TU từ real-data.ts
//
// Workflow:
// 1. Phiếu nhập: Nháp → Chờ duyệt → Đã duyệt → Đã nhập kho (cập nhật tồn)
// 2. Phiếu xuất: Nháp → Chờ duyệt → Đã duyệt → Đã xuất kho (giảm tồn)
// 3. Kiểm kê: Đang kiểm → Chờ duyệt → Đã chốt (cập nhật tồn thực tế)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";
import { supabaseUpsertRaw, supabaseDelete, supabaseFetchAllRaw, isSupabaseEnabled } from "@/lib/supabase/client";

export type LoaiKho = "vai" | "phu-lieu" | "thanh-pham";
export type LoaiPhieu = "nhap" | "xuat" | "kiem-ke";

export type TrangThaiPhieuKho =
  | "Nháp"
  | "Chờ duyệt"
  | "Đã duyệt"
  | "Từ chối"
  | "Hoàn thành";

export const TRANG_THAI_PHIEU_KHO: TrangThaiPhieuKho[] = [
  "Nháp", "Chờ duyệt", "Đã duyệt", "Từ chối", "Hoàn thành",
];

export const TRANG_THAI_PK_STYLE: Record<TrangThaiPhieuKho, { color: string; bg: string }> = {
  "Nháp": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Chờ duyệt": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Đã duyệt": { color: "text-sky-700", bg: "bg-sky-500/15" },
  "Từ chối": { color: "text-rose-700", bg: "bg-rose-500/15" },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
};

export type PhieuKho = {
  id: string;              // PK-{timestamp}
  loai: LoaiPhieu;
  loaiKho: LoaiKho;
  maSP: string;            // Mã vải, mã phụ liệu, mã SP
  tenSP: string;
  soLuong: number;         // SL nhập/xuất
  donVi: string;           // m, kg, cái, bộ
  donGia: number;
  thanhTien: number;
  nhaCC?: string;          // NCC (cho phiếu nhập)
  lsx?: string;            // LSX liên quan (cho phiếu xuất)
  maNV: string;            // NV tạo phiếu
  nguoiTao: string;
  nguoiDuyet?: string;
  ngayTao: string;
  ngayDuyet?: string;
  ngayHoanThanh?: string;
  trangThai: TrangThaiPhieuKho;
  ghiChu?: string;
  lichSu: Array<{
    ngay: string;
    trangThaiCu: TrangThaiPhieuKho;
    trangThaiMoi: TrangThaiPhieuKho;
    nguoiThucHien: string;
    ghiChu?: string;
  }>;
};

const STORAGE_KEY = "mimin_kho_mobile_v1";
const STORAGE_TON_KEY = "mimin_kho_ton_delta_v1";

// FIX BUG #4: tồn kho runtime - lưu delta so với data gốc KHO_VAI/KHO_VAT_TU
// Khi phiếu nhập "Hoàn thành" → delta[loaiKho][maVT] += soLuong
// Khi phiếu xuất "Hoàn thành" → delta[loaiKho][maVT] -= soLuong
// Khi phiếu bị từ chối / xoá sau khi đã hoàn thành → revert delta
type TonKhoDelta = Record<LoaiKho, Record<string, number>>;

const EMPTY_TON_DELTA: TonKhoDelta = {
  "vai": {},
  "phu-lieu": {},
  "thanh-pham": {},
};

function loadTonDelta(): TonKhoDelta {
  if (typeof window === "undefined") return EMPTY_TON_DELTA;
  try {
    const raw = localStorage.getItem(STORAGE_TON_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY_TON_DELTA, ...parsed };
    }
  } catch {}
  return EMPTY_TON_DELTA;
}

function saveTonDelta(d: TonKhoDelta) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_TON_KEY, JSON.stringify(d));
  } catch {}
}

function buildDefault(): PhieuKho[] {
  // Bắt đầu vận hành kho thật: không tự tạo phiếu nhập/xuất mẫu.
  return [];
}

type StoreContext = {
  phieu: PhieuKho[];
  tonKhoDelta: TonKhoDelta; // FIX BUG #4: expose để helper tính tồn runtime
  taoPhieu: (data: Omit<PhieuKho, "id" | "ngayTao" | "trangThai" | "lichSu">, user: AppUser | null) => string;
  duyetPhieu: (id: string, user: AppUser | null) => void;
  tuChoiPhieu: (id: string, lyDo: string, user: AppUser | null) => void;
  hoanThanh: (id: string, user: AppUser | null) => void;
  xoaPhieu: (id: string, user: AppUser | null) => void;
  reset: () => void;
};

const Ctx = createContext<StoreContext | null>(null);

function loadData(): PhieuKho[] {
  if (typeof window === "undefined") return buildDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PhieuKho[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return buildDefault();
}

function saveData(d: PhieuKho[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

export function KhoMobileProvider({ children }: { children: ReactNode }) {
  const [phieu, setPhieu] = useState<PhieuKho[]>(buildDefault);
  const [tonKhoDelta, setTonKhoDelta] = useState<TonKhoDelta>(EMPTY_TON_DELTA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPhieu(loadData());
    setTonKhoDelta(loadTonDelta());
    setHydrated(true);
  }, []);

  // Đọc lại 2 chiều từ Supabase (nguồn chính). Bảng camelCase → đọc/ghi không convert key.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    let mounted = true;
    (async () => {
      const remote = await supabaseFetchAllRaw<PhieuKho>("kho_mobile", "created_at", false);
      if (!mounted) return;
      setPhieu(remote);
      saveData(remote);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (hydrated) saveData(phieu);
  }, [phieu, hydrated]);

  useEffect(() => {
    if (hydrated) saveTonDelta(tonKhoDelta);
  }, [tonKhoDelta, hydrated]);

  // FIX BUG #4: apply delta tồn kho khi phiếu chuyển trạng thái
  // - Phiếu nhập chuyển sang "Hoàn thành" → cộng dồn vào tồn
  // - Phiếu xuất chuyển sang "Hoàn thành" → trừ tồn
  // - Phiếu đã Hoàn thành bị từ chối/xoá → revert delta
  const applyTonDelta = useCallback((p: PhieuKho, sign: 1 | -1) => {
    setTonKhoDelta((prev) => {
      const next: TonKhoDelta = {
        ...prev,
        [p.loaiKho]: { ...(prev[p.loaiKho] || {}) },
      };
      const cur = next[p.loaiKho][p.maSP] || 0;
      const delta = (p.loai === "nhap" ? p.soLuong : p.loai === "xuat" ? -p.soLuong : 0) * sign;
      next[p.loaiKho][p.maSP] = cur + delta;
      return next;
    });
  }, []);

  const updateStatus = useCallback((id: string, trangThaiMoi: TrangThaiPhieuKho, user: AppUser | null, ghiChu?: string) => {
    let phieuCu: PhieuKho | undefined;
    let updated: PhieuKho | null = null;
    setPhieu((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      phieuCu = p;
      const lichSuMoi = [...(p.lichSu || []), {
        ngay: new Date().toISOString(),
        trangThaiCu: p.trangThai,
        trangThaiMoi,
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu,
      }];
      updated = {
        ...p,
        trangThai: trangThaiMoi,
        nguoiDuyet: trangThaiMoi === "Đã duyệt" ? (user?.name || user?.id) : p.nguoiDuyet,
        ngayDuyet: trangThaiMoi === "Đã duyệt" ? new Date().toISOString().split("T")[0] : p.ngayDuyet,
        ngayHoanThanh: trangThaiMoi === "Hoàn thành" ? new Date().toISOString().split("T")[0] : p.ngayHoanThanh,
        lichSu: lichSuMoi,
      };
      return updated;
    }));
    // FIX BUG #4: nếu chuyển sang "Hoàn thành" → apply delta +1
    if (trangThaiMoi === "Hoàn thành" && phieuCu) {
      applyTonDelta(phieuCu, 1);
    }
    // Nếu rời khỏi "Hoàn thành" (vd: chuyển sang "Từ chối" sau khi đã Hoàn thành) → revert
    if (phieuCu?.trangThai === "Hoàn thành" && trangThaiMoi !== "Hoàn thành") {
      applyTonDelta(phieuCu, -1);
    }
    if (isSupabaseEnabled && updated) {
      supabaseUpsertRaw("kho_mobile", updated as any).catch((err) =>
        console.error("[KhoMobileStore] Supabase upsert error:", err)
      );
    }
  }, [applyTonDelta]);

  const taoPhieu = useCallback((data: Omit<PhieuKho, "id" | "ngayTao" | "trangThai" | "lichSu">, user: AppUser | null) => {
    const id = `PK-${data.loai === "nhap" ? "NK" : data.loai === "xuat" ? "XK" : "KK"}-${data.loaiKho.toUpperCase().slice(0, 4)}-${Date.now()}`;
    const newPhieu: PhieuKho = {
      ...data,
      id,
      ngayTao: new Date().toISOString().split("T")[0],
      trangThai: "Chờ duyệt",
      lichSu: [{
        ngay: new Date().toISOString(),
        trangThaiCu: "Nháp",
        trangThaiMoi: "Chờ duyệt",
        nguoiThucHien: user?.name || user?.id || "unknown",
        ghiChu: "Tạo phiếu mới",
      }],
    };
    setPhieu((prev) => [...prev, newPhieu]);
    logWorkflow(user, "create", `Tạo phiếu ${id}`, id);
    if (isSupabaseEnabled) {
      supabaseUpsertRaw("kho_mobile", newPhieu as any).catch((err) =>
        console.error("[KhoMobileStore] Supabase upsert error:", err)
      );
    }
    return id;
  }, []);

  const duyetPhieu = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Đã duyệt", user, "Duyệt phiếu");
    logWorkflow(user, "approve", `Duyệt phiếu ${id}`, id);
  }, [updateStatus]);

  const tuChoiPhieu = useCallback((id: string, lyDo: string, user: AppUser | null) => {
    updateStatus(id, "Từ chối", user, `Từ chối: ${lyDo}`);
    logWorkflow(user, "reject", `Từ chối phiếu ${id}`, id, { newValue: { lyDo } });
  }, [updateStatus]);

  const hoanThanh = useCallback((id: string, user: AppUser | null) => {
    updateStatus(id, "Hoàn thành", user, "Hoàn thành nhập/xuất kho");
    logWorkflow(user, "update", `Hoàn thành phiếu ${id}`, id);
  }, [updateStatus]);

  const xoaPhieu = useCallback((id: string, user: AppUser | null) => {
    // FIX BUG #4: nếu xoá phiếu đã Hoàn thành → revert delta
    setPhieu((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.trangThai === "Hoàn thành") {
        applyTonDelta(target, -1);
      }
      return prev.filter((p) => p.id !== id);
    });
    logWorkflow(user, "delete", `Xoá phiếu ${id}`, id);
    if (isSupabaseEnabled) {
      supabaseDelete("kho_mobile", id).catch((err) =>
        console.error("[KhoMobileStore] Supabase delete error:", err)
      );
    }
  }, [applyTonDelta]);

  const reset = useCallback(() => {
    setPhieu(buildDefault());
    setTonKhoDelta(EMPTY_TON_DELTA);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(STORAGE_TON_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ phieu, tonKhoDelta, taoPhieu, duyetPhieu, tuChoiPhieu, hoanThanh, xoaPhieu, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKhoMobile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKhoMobile must be used within KhoMobileProvider");
  return ctx;
}
